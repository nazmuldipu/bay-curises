import { readdir, mkdir, writeFile } from 'fs/promises';
import sharp from 'sharp';
import pAll from 'p-all';
import { join, extname, basename } from 'path';
import { performance } from 'perf_hooks';
import { rmNoExist, GITIGNORE_EMPTY_DIR } from './lib.js';
import { platform } from 'os';

const imagesURL = new URL('../images', import.meta.url);
// on windows, need to get rid of leading '/' that URL generates for later path logic to work
const imagesPath = platform() === 'win32' ? decodeURI(imagesURL.pathname.slice(1)) : decodeURI(imagesURL.pathname);
const SRC_DIR = 'src';
const OUTPUT_DIR = 'output';
const DIMENSION_SEP = '_';

/**
 * For image paths that are non-webp rasters, we want to additionally produce a webp image for them
 * @param {String} imgFile 
 * @param {Number} dimension 
 */
const pathsForDimension = (imgFile, dimension) => {
    const ext = extname(imgFile);
    const paths = [{
        path: join(imagesPath, OUTPUT_DIR, `${basename(imgFile, ext)}${dimension ? DIMENSION_SEP + dimension : ''}${ext}`),
        dimension
    }]
    if (!ext.match(/.(svg|webp)$/i)) {
        paths.push({
            path: join(imagesPath, OUTPUT_DIR, `${basename(imgFile, ext)}${dimension ? DIMENSION_SEP + dimension : ''}.webp`),
            dimension
        })
    }
    return paths;
}

/**
 * iteratively add to paths dimension wise until and not including width as long as itself
 * @param {String} imgFile 
 * @param {Number} width 
 */
const getResponsivePaths = (imgFile, width) => {
    const paths = [];
    let dimension = 300;
    while (dimension < width) {
        Array.prototype.push.apply(paths, pathsForDimension(imgFile, dimension));
        dimension *= 2;
    }
    Array.prototype.push.apply(paths, pathsForDimension(imgFile));
    return paths;
};

const formatTranslation = ext => {
    switch(ext) {
        case 'jpg':
            return 'jpeg';
        default:
            return ext;
    }
}

try {
    const outputPath = join(imagesPath, OUTPUT_DIR);
    await rmNoExist(outputPath);
    await mkdir(outputPath);
    // replace .gitignore
    // await writeFile(join(outputPath, '.gitignore'), GITIGNORE_EMPTY_DIR);
    const imgFiles = await readdir(join(imagesPath, SRC_DIR));
    const images = imgFiles
        .filter(imgFile => imgFile.match(/.(jpg|jpeg|png|webp)$/i))
        .map(imgFile => ({
            data: sharp(join(imagesPath, SRC_DIR, imgFile)),
            path: join(imagesPath, SRC_DIR, imgFile)
        }))
    
    const conversions = [];
    for(const image of images) {
        const { width } = await image.data.metadata();
        const responsivePaths = getResponsivePaths(image.path, width);
        Array.prototype.push.apply(
            conversions,
            responsivePaths.map(responsivePath =>  
                () => image.data
                        .clone()[ formatTranslation(extname(responsivePath.path).substring(1)) ]()
                        .resize(responsivePath.dimension || width)
                        .toFile(responsivePath.path)
            )    
        )
    }
    const start = performance.now();
    await pAll(conversions, { concurrency: 4 }); //we get diminishing returns around 4
    const end = performance.now();
    console.log('time', end - start)
}
catch (e) {
    // TODO: add automated cleanup of files in case of error
    console.error('error', e)
}

/**
 * Below is some prototype code for creating SVG out of raster for possibility of dynamic load
 */

//import ImageTracer from 'imagetracerjs';

/* const { data, info } = await sharp(join(imagesPath, 'hero-home-large.jpg')).resize(800).raw().toBuffer({ resolveWithObject: true })
const { data: data1, info: info1 } = await sharp(join(imagesPath, 'hero-home-large.jpg')).resize(600, 800).raw().toBuffer({ resolveWithObject: true }) */

/* const svgStr = ImageTracer.imagedataToSVG(
    {
        width: info.width,
        height: info.height,
        data
    },
    { qtres:10, ltres:10, numberofcolors:16, blurradius:100, blurdelta: 256, strokewidth:32, scale: 5.625 }
);

fs.writeFileSync(path.join(imagesPath, 'hero-vector.svg'), svgStr)

const svgStr1 = ImageTracer.imagedataToSVG(
    {
        width: info1.width,
        height: info1.height,
        data: data1
    },
    { qtres:10, ltres:10, numberofcolors:16, blurradius:100, blurdelta: 256, strokewidth:16, scale: 1.5 }
);
fs.writeFileSync(path.join(imagesPath, 'hero-vector-900.svg'), svgStr1) */
