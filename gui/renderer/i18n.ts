type Words = {
  chooseDirectory: string;
  algo: string;
  startSearch: string;
  duplicatedFileIsNotFound: string;
  deleteDialogMessage: (name: string) => string;
  deleteDialogDetail: string;
  deleteDialogOk: string;
  deleteDialogCancel: string;
  errorNoEnt: string;
  errorNotDirectory: string;
  errorJava: string;
  errorInternal: string;
};

const ja: Words = {
  chooseDirectory: "ディレクトリ選択",
  algo: "アルゴリズム",
  startSearch: "検索開始",
  duplicatedFileIsNotFound: "重複した画像ファイルは見つかりませんでした",
  deleteDialogMessage: (name: string) => `'${name}'を削除しますか?`,
  deleteDialogDetail: "このファイルはゴミ箱から復元できます",
  deleteDialogOk: "ゴミ箱に移動",
  deleteDialogCancel: "キャンセル",
  errorNoEnt: "ディレクトリが存在しません",
  errorNotDirectory: "ディレクトリではありません",
  errorJava:
    "Javaが発見できませんでした。おそらくJavaがインストールされていません",
  errorInternal: "内部エラー",
};

const en: Words = {
  chooseDirectory: "Select Directory",
  algo: "Algorithm",
  startSearch: "Start Search",
  duplicatedFileIsNotFound: "Duplicated image files are not found.",
  deleteDialogMessage: (name: string) =>
    `Are you sure you want to delete '${name}'?`,
  deleteDialogDetail: "You can restore this file from the Recycle Bin.",
  deleteDialogOk: "Move to Recycle Bin",
  deleteDialogCancel: "Cancel",
  errorNoEnt: "Not exist",
  errorNotDirectory: "Not a directory",
  errorJava: "Java is not found. Maybe Java isn't installed",
  errorInternal: "Internal error",
};

export = navigator.language === "ja" ? ja : en;
