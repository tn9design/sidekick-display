import {mkdir,cp,readFile,writeFile,readdir,copyFile} from 'node:fs/promises';
await mkdir(new URL('./dist/',import.meta.url),{recursive:true});
await cp(new URL('./src/',import.meta.url),new URL('./dist/',import.meta.url),{recursive:true});
for(const name of await readdir(new URL('./assets/',import.meta.url)))if(!name.includes('backgrounds'))await copyFile(new URL(`./assets/${name}`,import.meta.url),new URL(`./dist/${name}`,import.meta.url));
for(const name of await readdir(new URL('./assets/backgrounds/',import.meta.url)))await copyFile(new URL(`./assets/backgrounds/${name}`,import.meta.url),new URL(`./dist/${name}`,import.meta.url));
const main=new URL('./dist/sidekick-display.js',import.meta.url);
await writeFile(main,(await readFile(main,'utf8')).replaceAll('./backgrounds/','./'));
console.log('Built flat HACS distribution');
