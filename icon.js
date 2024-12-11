//import { Icon } from './icon.js';
import  { getRGBA }  from './importbitmap.js';


export class Icon { 
    headerData;
    iconDataSize;
    width;
    height;
    bpp;
    pbpp
    palette;
    paletteSize = 0x400; //hard coded for now, at 1024 bytes
    paletteOffset = 0x3D; // offset starts from beginning of icon header
    rasterData;
    rasterOffset;
    imageDataRGBA;


    constructor(b){
        this.headerData = b.slice(0, 0x3D);
        const workingBuffer = new DataView(b.buffer); // must be little endian 
        
        // header length 0x3D
        this.iconDataSize = workingBuffer.getUint32(0, true);
        const offset = 4;
        
        this.width = workingBuffer.getUint32(offset + 0x15, true);
        this.height = workingBuffer.getUint32(offset + 0x19, true);
        this.bpp = workingBuffer.getUint16(offset + 0x1F, true);
        this.pbpp = workingBuffer.getUint32(offset + 0x35, true);

        this.rasterOffset = this.paletteOffset + this.paletteSize;
        this.palette = b.slice(0x3D, this.rasterOffset);
        
        const rasterSize = this.width * this.height;
        this.rasterData =  b.slice(this.rasterOffset, (this.rasterOffset + rasterSize));
        this.imageDataRGBA = getRGBA(this);
    }


}