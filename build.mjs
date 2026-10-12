import {mkdir,copyFile,cp} from 'node:fs/promises';
await mkdir(new URL('./dist/',import.meta.url),{recursive:true});
await cp(new URL('./assets/',import.meta.url),new URL('./dist/',import.meta.url),{recursive:true});
await cp(new URL('./src/',import.meta.url),new URL('./dist/',import.meta.url),{recursive:true});
console.log('Built Sidekick Display');
