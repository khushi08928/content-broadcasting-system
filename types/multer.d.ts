declare module "multer" {
    import { RequestHandler } from "express";

    interface File {
        fieldname: string;
        originalname: string;
        encoding: string;
        mimetype: string;
        size: number;
        destination: string;
        filename: string;
        path: string;
        buffer: Buffer;
    }

    interface StorageEngine {
        _handleFile(req: any, file: any, cb: (error: any, info?: any) => void): void;
        _removeFile(req: any, file: any, cb: (error: any) => void): void;
    }

    interface DiskStorageOptions {
        destination?: string | ((req: any, file: any, cb: (error: any, destination: string) => void) => void);
        filename?: (req: any, file: any, cb: (error: any, filename: string) => void) => void;
    }

    interface Options {
        storage?: StorageEngine;
        fileFilter?: (req: any, file: any, cb: any) => void;
        limits?: {
            fieldNameSize?: number;
            fieldSize?: number;
            fields?: number;
            fileSize?: number;
            files?: number;
            parts?: number;
            headerPairs?: number;
        };
    }

    interface Multer {
        single(fieldname: string): RequestHandler;
        array(fieldname: string, maxCount?: number): RequestHandler;
        fields(fields: { name: string; maxCount?: number }[]): RequestHandler;
        none(): RequestHandler;
        any(): RequestHandler;
    }

    function multer(options?: Options): Multer;

    namespace multer {
        function diskStorage(options: DiskStorageOptions): StorageEngine;
        function memoryStorage(): StorageEngine;
    }

    export = multer;
}
