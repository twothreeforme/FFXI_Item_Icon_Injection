import * as Strings from './strings.js';
import { Icon } from './icon.js';


const itemType = {
    nothing: 0,
    currency: 1,
    item: 2,
    usableItem : 3,
    puppetItem : 4,
    armor : 5,
    weapon : 6,
    storageSlip : 7,
    monstrosity : 8
}

const offsets =  {
    id: 0x0,
    flags: 0x4,
    stacksize: 0x6,
    type: 0x8,
    resourceID: 0xA,
    validTargets: 0xC
}

/**
 * 
 * @param {Uint8Array} b item array from DAT
 */
export class Item {
    id; // 0x4
    // flags 0x2
    // stacksize 0x2
    type = itemType.Nothing; // 0x2
    // resource ID 0x2
    // valid targets 0x2

    offset; // set externally
    nameFull = "";
    nameLC = "";
    namePlural = "";
    description = "";
    icon;
    iconOffset; // set externally

    constructor(b){
    const workingBuffer = new DataView(b.buffer); // must be little endian 

    this.id = workingBuffer.getUint32(offsets.id, true);
    this.type = this.getItemType(this.id);

    let workingOffset = 0xE; // common fields (above) have length 14 = 0xE

    switch(this.type){
        case itemType.armor:
            workingOffset += 0x1E;
            break;
        case itemType.weapon:
            workingOffset += 0x2A;
            break;
        case itemType.puppetItem:
            workingOffset += 0xA;
            break;
        case itemType.item:
            workingOffset += 0xA;
            break;
        default:
            workingOffset += 0x52
            break;
    }

    // if ( (this.id >= 16384 && this.id <= 16389) || (this.id >= 1 && this.id <= 4) ){
    //     console.log("id: " + this.id);
    //     console.log("type: " + this.type);
    //     console.log("workingOffset: " + workingOffset.toString(16));
    //     // console.log("stringCount: " + stringCount);
    //     // console.log("stringOffset: " + workingOffset.toString(16));
    // }
    const stringOffset = workingOffset + 0x48;

    var nameEnum = 0; // 0=name, 1=lowercase, 2=plural, 3=description
    for( var n = stringOffset; n <= 0x280; n++ ){ // name/description length is 0x220, until icon starts
        // console.log(workingBuffer.getUint16(n, true));
        
        /* typically a 0x1B spacing between each label following
        the 0x00 0x01 bytes, but some like 'Oak Table' have more
        so just avoid the 0x00 bytes in the string output*/
        if ( workingBuffer.getUint16(n, true) == 0x02 ) continue;

        if ( workingBuffer.getUint16(n, true) == 0x01 ){
            n += 0x1B;
            nameEnum++;
            if ( nameEnum == 4 ) break;
            continue;
        }
       
        if ( workingBuffer.getUint8(n) == 0x00 ) {
            if ( nameEnum == 3 ) break;
            continue;
        }
        const byte = workingBuffer.getUint8(n);
        var str = "";
        if ( byte == 0x20 ) str += " ";
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

    getItemType(id){
        switch (true){
            case id == 0xffff:
                return itemType.currency;
            case id < 0x1000:
                return itemType.item;
            case id < 0x2000:
                return itemType.usableItem;
            case id < 0x2200:
                return itemType.puppetItem;
            case id < 0x2800:
                return itemType.item;
            case id < 0x4000:
                return itemType.armor;
            case id < 0x5A00:
                return itemType.weapon;
            case id < 0x7000:
                return itemType.armor;
            case id < 0x7400:
                return itemType.storageSlip;
            case id < 0x7800:
                return itemType.monstrosity;
            case id < 0xF200:
                return itemType.monstrosity;
            default:
                return itemType.nothing;

        }
    }
}


