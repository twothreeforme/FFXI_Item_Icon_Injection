
/**
 * Decodes FFXI DAT into Uint8Array
 * @param {Uint8Array} buffer   8 bit array to be written
 */
export function decodeDAT(buff){
    //const buff = new Uint8Array(dat);
    for (let i = 0; i < buff.length; i++) {
        buff[i] = (buff[i] >> 5) | (buff[i] << 3);
    }
    return buff;
}

export function encodeDAT(buffer){
    for (let i = 0; i < buffer.length; i++) {
        buffer[i] = (buffer[i] << 5) | (buffer[i] >> 3);
    }
    return buffer;
}

/**
 * Writes Blob class object, representing binary, to file
 * @param {Uint8Array} uint8Array   8 bit array to be written
 * @param {String} filename     name of output file
 */
export function writeBlobToFile(uint8Array, filename){
//   const binaryString = base64ToArrayBuffer(base64);
    const blob = new Blob([uint8Array], { type: 'application/octet-stream' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
}

