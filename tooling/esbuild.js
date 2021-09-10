'use strict';
import esbuild from 'esbuild';
import {readFileSync} from 'fs';
import {join} from 'path';
import { rmNoExist } from './lib.js';

/**
 * We assume that the relative paths given in metadata
 * can be made absolute by process.cwd()
 * because we assume that build commands will be run at the project
 * root directory
 * @param {*} metadata -- esbuild metafile output
 */
export const getJSBuildDeps = metadata =>
    new Set(Object
        .keys(metadata.inputs)
        .map(relativePath => join(process.cwd(), relativePath)))

const getSkipperWebsiteAPIBase = () => {
    switch(process.env.NODE_ENV) {
        case 'production':
            return '"https://hotel-site.skipperhospitality.com"';

        case 'staging':
            return '"https://hotel-site-stage.skipperhospitality.com"';

        default:
            return '"https://hotel-site-dev.skipperhospitality.com"';
    }
};

const getSkipperWebsiteToken = () => {
    switch(process.env.NODE_ENV) {
        case 'production':
            return '"this-is-my-secret-token-XXXXXXX"';

        case 'staging':
            return '"this-is-my-secret-token-XXXXXXX"';

        default:
            return '"this-is-my-secret-token-XXXXXXX"';
    }
};

/**
 * 
 * @param {String[]} inputPaths 
 * @param {String} outDir 
 * @param {String} outBase
 * @param {String} metafilePath
 */
export const buildJS = async (inputPaths, outDir, outBase, metafilePath) => {
    //make sure to tune the operation based on environment
    await esbuild.build({
        entryPoints: inputPaths,
        bundle: true,
        format: 'esm',
        external:[ 
            '*.jpg',
            '*.webp',
            '*.png',
            '*.woff',
            '*.woff2',
            '*.ttf'
        ],
        outdir: outDir,
        outbase: outBase,
        target: ['es2017'],
        minify: process.env.NODE_ENV === 'production',
        metafile: metafilePath,
        SKIPPER_WEBSITE_API_BASE: getSkipperWebsiteAPIBase(),
        SKIPPER_WEB_API_TOKEN: getSkipperWebsiteToken()
    });

    const metadata = JSON.parse(readFileSync(metafilePath));
    await rmNoExist(metafilePath);
    return {
        buildDeps: getJSBuildDeps(metadata),
        outputFiles: Object.keys(metadata.outputs)
    };
}