import * as Strings from './strings.js';
import { Icon } from './icon.js';



const itemType = {
    UNKNOWN: 0,
    ITEM: 1,
    EMPTY: 2,
}

/**
 * 
 * @param {Uint8Array} b item array from DAT
 */
export class Item {
    type = itemType.UNKNOWN;
    id;
    offset; // set externally
    nameFull = "";
    nameLC = "";
    namePlural = "";
    description = "";
    icon;
    iconOffset; // set externally

    constructor(b){
    const workingBuffer = new DataView(b.buffer); // must be little endian 

    this.id = workingBuffer.getUint16(0, true);  
    //console.log("itemid: " + this.id)

    var nameEnum = 0; // 0=name, 1=lowercase, 2=plural, 3=description
    for( var n = 0x60; n <= 0x280; n++ ){ // name/description length is 0x220, until icon starts
        // console.log(workingBuffer.getUint16(n, true));
        
        /* typically a 0x1B spacing between each label following
        the 0x00 0x01 bytes, but some like 'Oak Table' have more
        so just avoid the 0x00 bytes in the string output*/
        if ( workingBuffer.getUint16(n, true) == 1 ){
            n+=0x1B;
            nameEnum++;
            if ( nameEnum == 4 ) break;
            continue;
        }
       
        if ( workingBuffer.getUint8(n) == 0 ) {
            if ( nameEnum == 3 ) break;
            continue;
        }
        const byte = workingBuffer.getUint8(n);
        var str = "";
        if ( byte == 10 ) str += " ";
        else if ( byte != 46 ) str += Strings.stringFromChar(byte);

        switch(nameEnum){
            case 0:
                this.nameFull += str;
                break;
            case 1:
                this.nameLC += str;
                break;
            case 2:
                this.namePlural += str;
                break;
            case 3:
                this.description += str;
                break;
        }
    }

    //const iconBufferSize = workingBuffer.getUint32(0x280, true);
    //const iconBuffer = b.slice(0x284, 0x284 + 0x39);
    this.icon = new Icon(b.slice(0x280, 0x280 + 0x980));
    }
}


