
import * as FileWork from './FileWork.js';
import * as Strings from './strings.js';
import { ItemsCollection } from './itemscollection.js';
import  { ImportBitmap } from './importbitmap.js';

/**
 * Defaults
 */
var step1complete = false;
var step2complete = false;
var step3complete = false;
var step4complete = false;

var fileName = null;
var decodedDAT = null;
var collection = null;
var selectedItemId = null;
var injectImage = null;

/**
 * Inject button setup
 */
document.getElementById("injectButton").disabled = true;
document.getElementById("injectButton").addEventListener('click', function(){
    inject();
});

/**
 * Save - buttons setup
 */
document.getElementById("saveAllIcons").disabled = true;
document.getElementById("saveAllIcons").addEventListener('click', function(){
    saveAllIcons();
});

document.getElementById("saveDecodedDAT").disabled = true;
document.getElementById("saveDecodedDAT").addEventListener('click', function(){
    saveDecodedDAT();
});

/**
 * Reload window button setup
 */
document.getElementById('restartButton').addEventListener('click', function(){
    window.location.reload();
});

/**
 * 
 * Step 1
 * 
 */
document.getElementById('input_DAT').addEventListener('change', function(){
    var reader = new FileReader();
    reader.onload = function(){
        var rawDAT = new Uint8Array(this.result);
        decodedDAT  = FileWork.decodeDAT(rawDAT);
        //console.log(decodedDAT);

        const para = document.getElementById('step1success')
        para.innerHTML = "DAT loaded"
        step1complete = true;

        document.getElementById("saveDecodedDAT").disabled = false;
        document.getElementById("saveAllIcons").disabled = false;

        fillSelectItemsList(decodedDAT);
        }
    reader.readAsArrayBuffer(this.files[0]);
    fileName = this.files[0].name;
  }, false);


/**
 * 
 * Step 2
 * 
 */
const selectElement = document.getElementById("selectItem");
    selectElement.addEventListener("change", function() {
    //var id = collection.items[0].id + this.value;
    displayItem(this.value);
    step2complete = true;
    selectedItemId = this.value;
    const para = document.getElementById('step2success');
    para.innerHTML = "<b>Offset data:</b> <br><b>Item:</b> " + Strings.decimalToHex(collection.items[selectedItemId].offset) + "<br><b>Icon:</b> " + Strings.decimalToHex(collection.items[selectedItemId].iconOffset);
});

function fillSelectItemsList(decodedDAT){
    collection = new ItemsCollection(decodedDAT);
    const selectItemElement = document.getElementById("selectItem");
    for ( var opt = 0; opt < collection.items.length ; opt++ ){
        const str = "[" + collection.items[opt].id + "] " + collection.items[opt].nameFull;
        const newOption = new Option(str, opt);
        selectItemElement.add(newOption);
    }
}

// function clearAllOptions(){
//     const selectItemElement = document.getElementById("selectItem");
//     var i, L = selectItemElement.options.length - 1;
//     for(i = L; i >= 0; i--) {
//         selectItemElement.remove(i);
//     }
// }

function displayItem(itemid){
    var table = document.getElementById("itemSelected");
    table.innerHTML = ""; // reset table
    var row = table.insertRow(0);

    var cellImage = row.insertCell(0);
    var cellText = row.insertCell(1);

    const item = collection.items[itemid];
    //console.log(itemid)

    cellText.innerHTML = "<b>Name:</b> " + item.nameFull + "<br><b>Description</b>: " + item.description;

    var img = document.createElement('img');
    img.src = getURLFromIcon(item.icon);

    img.style.width = "40px";
    img.style.height = "40px";

    cellImage.appendChild(img);
}

/**
 * 
 * Step 3
 * 
 */
document.getElementById('injectImage').addEventListener('change', function(){
    var reader = new FileReader();
    reader.onload = function(){
        var rawImage = new Uint8Array(this.result);

        injectImage = new ImportBitmap(rawImage);
        console.log(injectImage);

        const para = document.getElementById('step3success');
        
       
        var img = document.createElement('img');
        img.src = getURLFromIcon(injectImage);
        
        img.style.width = "40px";
        img.style.height = "40px";

        const step3DIV = document.getElementById('step3');
        step3DIV.appendChild(img);
        para.innerHTML = "Image loaded";
        
        document.getElementById("injectButton").disabled = false;
        step3complete = true;
        }
    reader.readAsArrayBuffer(this.files[0]);
  }, false);


/**
 * 
 * Step 4
 * 
 */
function inject(){
    const item = collection.items[selectedItemId];
    
    //offset for inject is 
    //itemOffset + 0x280 + 0x3D
    const colorPaletteOffset = item.iconOffset;
    const rasterDataOffset = item.iconOffset + 1024;

    //console.log(injectOffset);

    //bitmap.length should = 2048 bytes

    //write new icon to 
    //DAT + iconOffset
    decodedDAT.set(injectImage.palette, colorPaletteOffset);
    decodedDAT.set(injectImage.rasterData, rasterDataOffset);

    //encode DAT
    const encodedDat  = FileWork.encodeDAT(decodedDAT);
    
    //auto-download new DAT
    const fn = fileName.split("."); 
    var downloadFN = fn[0] + "_injected.DAT";
    //console.log(downloadFN);
    FileWork.writeBlobToFile(encodedDat, downloadFN);
}


/**
 * 
 * Helpers
 * 
 */
function getURLFromIcon(bitmap){
    const canvas = document.createElement('canvas');

    canvas.width = bitmap.width;
    canvas.height = bitmap.height;

    const ctx = canvas.getContext('2d');
    const imageData = ctx.createImageData( canvas.width, canvas.height);
    if ( bitmap instanceof ImportBitmap ) imageData.data.set(bitmap.imageData);
    else imageData.data.set(bitmap.imageDataRGBA);

    ctx.putImageData(imageData, 0, 0);
    
    return canvas.toDataURL();
}

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

async function saveAllIcons(){
    for ( var opt = 0; opt < collection.items.length ; opt++ ){
    //for ( var opt = 0; opt < 50 ; opt++ ){
        const item = collection.items[opt];
        const imgURL = getURLFromIcon(item.icon);
        const str = "itemid_" + item.id + ".png";
        if ( item.nameFull != "" ){
            downloadURL(imgURL, str);
            console.log("saving..." + str + ", " + item.nameFull);
            await sleep(300);
        }
    }
}

async function saveDecodedDAT(){
    const fn = fileName.split(".");
    var downloadFN = fn[0] + "_decoded.DAT";
    //console.log(downloadFN);
    FileWork.writeBlobToFile(decodedDAT, downloadFN);
}

function downloadURL(url, filename) {
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

// function resetpage(){
//     step1complete = false;
//     step2complete = false;
//     step3complete = false;
//     step4complete = false;

//     decodedDAT = null;
//     collection = null;
//     selectedItemId = null;
//     injectImage = null;
    
//     clearAllOptions();
//     document.getElementById("injectButton").disabled = true;
// }
//resetpage();