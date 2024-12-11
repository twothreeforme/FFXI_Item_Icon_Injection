
import { Item } from './items.js';


/**
 * 
 * 
 */
export class ItemsCollection {
    items = [];

    constructor(b){ //assume DAT is appropriate
        const datArray = new Uint8Array(b);

        if ((datArray.length % 0xc00) !== 0) {
            throw new Error('Invalid Item resource file, datArray.length: ' + datArray.length);
        }

        const numberOfItems = datArray.length / 0xc00;
        const itemBufferLength = 0xC00;
        for (let i = 0; i < datArray.length; i += itemBufferLength) {
            //const offset = i * itemBufferLength;
            const item = new Item(datArray.slice(i, i + itemBufferLength));
            //console.log(i, offset);
            item.offset = i;
            item.iconOffset = item.offset + 0x280 + 0x3D; 
            this.items.push(item);
        }
    }

}