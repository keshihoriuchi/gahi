export interface ImageFile {
  path: string;
  name: string;
  width: number;
  height: number;
  birthtime: Date;
  mtime: Date;
  size: number;
}

export type Gahi = {
  chooseDirectory: () => Promise<{ canceled: boolean; filePaths: string[] }>;
  moveToTrash: (path: string) => Promise<boolean>;
  deleteDialog: (
    message: string,
    detail: string,
    ok: string,
    cancel: string
  ) => Promise<boolean>;
  cli: {
    start: (dirpath: string, algo: string) => void;
    addIntermListenser: (listener: (e: any, d: any) => void) => void;
    removeIntermListenser: (listener: (e: any, d: any) => void) => void;
    addResultsListenser: (listener: (e: any, d: any) => void) => void;
    removeResultsListenser: (listener: (e: any, d: any) => void) => void;
    addErrorListenser: (listener: (e: any, d: any) => void) => void;
    removeErrorListenser: (listener: (e: any, d: any) => void) => void;
    fetchImagefiles: (offset: number, count: number) => Promise<ImageFile[][]>;
  };
};
