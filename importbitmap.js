const imageType = {
    UNKNOWNN: 0,
    PNG: 1,
    BMP: 2,
    TGA: 3
};

//https://stackoverflow.com/questions/76127214/compare-equality-of-two-uint8array
function isEqualArray(a, b) { if (a.length != b.length) return false; for (let i = 0; i < a.length; i++) if (a[i] != b[i]) return false; return true; }

export class ImportBitmap {
    constructor(b){
        //const uintarray = new Uint8Array(b);

        this.type = imageType.UNKNOWNN;

        this.width = null; 
        this.height = null; 
        this.textureOffset = null;
        this.bpp = null;
        this.totalPaletteColors = null; //currently only used in BMP

        this.palette = null;
        this.paletteSize = null;
        this.rasterData = null;

        // test for PNG
        let testSig = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);
        let signature = b.slice(0,8);
        if ( isEqualArray(signature, testSig) ) {

            this.type = imageType.PNG;
            this.importPNG(b);
            return;
        }

        // test for BMP
        testSig = new Uint8Array([0x42, 0x4D]);
        signature = b.slice(0,2);
        if ( isEqualArray(signature, testSig) ) {

            this.type = imageType.BMP;
            this.importBMP(b);
            return;
        }

        // test for TGA
        testSig = new Uint8Array([0x00, 0x01, 0x01]);
        signature = b.slice(0,3);
        if ( isEqualArray(signature, testSig) ) {

            this.type = imageType.TGA;
            this.importTGA(b);
            return;
        }
    }

    getBit(bitOffset, forByte) {
        return (forByte & (1 << bitOffset)) !== 0 ? 1 : 0;
      }

    importTGA(b){
        // http://www.paulbourke.net/dataformats/tga/

        console.log("TGA found");

        // DataView functions must use LITTLE ENDIAN in TGAs
        const workingImage = new DataView(b.buffer);

        /* Color Map Entry Size.
        Number of bits in each color map entry.  16 for
        the Targa 16, 24 for the Targa 24, 32 for the Targa 32. */
        const colorMapEntrySize = workingImage.getUint8(7) / 8;
        this.paletteSize = workingImage.getUint16( 5, true ) * colorMapEntrySize;

        console.log("pal size: " + this.paletteSize);
        // const xOrigin  = workingImage.getUint16( 8, true );
        // const yOrigin  = workingImage.getUint16( 10, true );
        this.width  = workingImage.getUint16( 12, true );
        if ( this.width != 32 ){
            console.log("Width: " + this.width + ", Width should be 32, image saved incorrectly");
            return ;
        }

        this.height  = workingImage.getUint16( 14, true );
        if ( this.width != 32 ){
            console.log("Height: " + this.height + ", Height should be 32, image saved incorrectly");
            return ;
        }

        this.bpp  = workingImage.getUint8( 16, true );
        if ( this.bpp != 8 ){
            console.log("Bits per pixel: " + this.bpp + ", BPP should be 8, image saved incorrectly");
            return ;
        }

        const imageDescriptor_bit6 = this.getBit(6, workingImage.getUint8( 17 ));
        const imageDescriptor_bit7 = this.getBit(7, workingImage.getUint8( 17 ));
        //console.log(imageDescriptor_bit6,imageDescriptor_bit7 )
        if ( imageDescriptor_bit6 != 0 && imageDescriptor_bit7 != 0 ){
            console.log("imageDescriptor bits: " + imageDescriptor_bit6 + ", " + imageDescriptor_bit7 + ", Image Descriptor should be 0, image saved incorrectly");
            return ;
        }

        //const paletteSize = this.width * this.height;

        this.palette = new Uint8Array(b.slice(18, (18 + this.paletteSize) ));
        this.palette[this.paletteSize] = 0xFF;

        const imageOffset = 18 + this.paletteSize;
        this.rasterData = new Uint8Array(b.slice(imageOffset, (imageOffset + (this.width * this.height)) ));
        this.imageData = getRGBA(this);
    }

    importBMP(b){
        console.log("BMP found");

        // DataView functions must use LITTLE ENDIAN in BMPs
        const workingImage = new DataView(b.buffer);
        var currentOffset = 2; // BMP file size
        const bmpSize  = workingImage.getUint32(currentOffset, true );

        var currentOffset = 10; // image data offset
        const imgDataOffset  = workingImage.getUint32(currentOffset, true );
        // console.log("img data offset: " + imgDataOffset);

        var DIB_HeaderOffset = 14; /// DIB header size
        const DIB_HeaderSize  = workingImage.getUint32(DIB_HeaderOffset, true );

        // https://en.wikipedia.org/wiki/BMP_file_format
        // BMP file header = 14 bytes
        // DIB header = fixed size, but we get from the file itself as DIB_HeaderSize
        // shouldnt have any extra bit masks in BMP as long as there is no compression
        // and its 8 BPP
        // color table offset should be immediately after that
        const colorTableOffset = DIB_HeaderSize + 14;

        DIB_HeaderOffset = 18; /// width
        this.width  = workingImage.getUint32(DIB_HeaderOffset, true );

        DIB_HeaderOffset = 22; /// height
        this.height  = workingImage.getUint32(DIB_HeaderOffset, true );

        DIB_HeaderOffset = 26; /// planes
        this.planesCount  = workingImage.getUint8(DIB_HeaderOffset, true );

        DIB_HeaderOffset = 28; /// BPP (bitcount)
        this.BPP  = workingImage.getUint8(DIB_HeaderOffset, true );

        DIB_HeaderOffset = 30; /// compression
        this.compression  = workingImage.getUint32(DIB_HeaderOffset, true );

        DIB_HeaderOffset = 34; /// image size
        this.imageSize  = workingImage.getUint32(DIB_HeaderOffset, true );

        DIB_HeaderOffset = 46; /// colors used in palette
        this.totalPaletteColors  = workingImage.getUint8(DIB_HeaderOffset, true );
        //console.log(this.totalPaletteColors)

        var temp = new Uint8Array(b.slice(colorTableOffset, colorTableOffset + 1024 ));

        // rescale alpha for the icon textures in BMPs
        // BMPs use 0x00 instead of 0xFF in the alpha channel
        // due to BMPs not supporting an alpha channel while
        // indexed
        for (let x = 0; x < temp.length; x += 4) {
            temp[x + 3] = 255;
            if ( (temp.length - x) <= 5 ) temp[x + 3] = 0;
        }
        this.palette = temp;

        this.rasterData = new Uint8Array(b.slice(imgDataOffset, imgDataOffset + 1024 ));
    }

    importPNG(b){
        // http://www.libpng.org/pub/png/book/chapter08.html#png.ch08.div.5.2

        console.log("PNG found - not supported yet");

        const workingImage = new DataView(b.buffer);
        // chunk slice offset starts at 8
        var currentOffset = 8
        const chunkSize  = workingImage.getUint32(currentOffset );
        const chunkType = workingImage.getUint32(currentOffset + 4 );

        // should be IHDR chunk
        // IHDR should be [49, 48, 44, 52] = (Uint32 - BIG endian) 1229472850
        if ( chunkType != 1229472850 ) {
            console.log("PNG found - chunk: size: " + chunkSize + ", type: (HEX)" + chunkType.toString(16) + " / (dec)" + chunkType + " , chunk doesnt match IHDR, image saved incorrectly");
            return ;
        }

        currentOffset += 4 + 4;

        // in IHDR chunk
        // IHDR chunk size 13 bytes
        this.width = workingImage.getUint32(currentOffset);
        this.height = workingImage.getUint32(currentOffset + 4);
        this.bitDepth = workingImage.getUint8(currentOffset + 4 + 4);
        this.colorType = workingImage.getUint8(currentOffset + 4 + 4 + 1);
        if ( this.colorType != 3 ) {  // http://www.libpng.org/pub/png/spec/1.2/PNG-Chunks.html
            console.log("PNG found - Color type incorrect: " + this.colorType + ", chunk doesnt list PLTE chunk, image not indexed");
            //return;
        }
        this.compressionMethod = workingImage.getUint8(currentOffset + 11);

        currentOffset += 13;

        const IDATsize = workingImage.getUint32(currentOffset);
        // console.log("w,h: " + this.width + ", " + this.height +
        //             " bitDepth: " + this.bitDepth +
        //             " colorType: " + this.colorType);

    }

    getImageBinary(){
        var tmp = new Uint8Array(this.palette.byteLength + this.rasterData.byteLength);
        tmp.set(this.palette, 0);
        tmp.set(this.rasterData, this.palette.byteLength);
        return tmp;
    }

}


/**
 * 
 * @param {Icon} icon icon class object
 * @returns {Uint8ClampedArray} with RGBA values
 * 
 * All credit for this function goes to ShiningFantasia
 * https://github.com/clanofartisans/ShiningFantasia
 */

export function getRGBA(icon){
    
    var offset = 0;
    const b =  new Uint8ClampedArray(1024 * 4); // hardcoded for icon images which are 1024 bytes

    for (let y = icon.height - 1; y >= 0; y--) {
        for (let x = 0; x < icon.width; x++) {
            const p = icon.rasterData[y * icon.width + x];
            //console.log(this.palette[p * 4 + 2]);

            // BGRA -> RGBA
            b[offset + 0] = icon.palette[p * 4 + 2];
            b[offset + 1] = icon.palette[p * 4 + 1];
            b[offset + 2] = icon.palette[p * 4 + 0];

            // rescale alpha for the icon textures
            b[offset + 3] = icon.palette[p * 4 + 3] * 255 / 128;
            //b[offset + 3] = icon.palette[p * 4 + 3];

            offset += 4;
        }
    }

    return b;
}

