
export const toHexString = arr => Array.from(arr, i => i.toString(16).padStart(2, "0")).join(" ");

export function stringFromChar(byte){
    return String.fromCharCode(byte);
}

export function decimalToHex(d) {
    return  (Number(d).toString(16)).toUpperCase()}

// export function convertByteArrayToAscii(byteArray) {
//     let result = "";
//     for (let i = 0; i < byteArray.length; i++) {
//       result += stringFromChar(byteArray[i]);
//     }
//     return result;
//   }

