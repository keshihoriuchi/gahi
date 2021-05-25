import React, { useEffect, useState, useLayoutEffect } from "react";
import Similars from "./components/Similars";
import { ImageFile, Gahi } from "../src/types";
import styled from "styled-components";
import ReactPaginate from "react-paginate";
import { FcApproval } from "react-icons/fc";
import I18n from "./i18n";

declare global {
  interface Window {
    gahi: Gahi;
  }
}

const algos = [
  "FCTH",
  "ColorLayout",
  "CEDD",
  "EdgeHistogram",
  // "PHOG",
  // "JCD",
  // "Gabor",
  // "JpegCoefficientHistogram",
  // "Tamura",
  // "LuminanceLayout",
  // "OpponentHistogram",
  // "ScalableColor",
];

const DirText = styled.input.attrs(() => ({
  className: "form-control",
  type: "text",
}))`
  margin-left: 10px;
  margin-right: 10px;
  flex-grow: 1;
`;

const AlgoSelect = styled.select.attrs(() => ({
  className: "form-control",
}))`
  margin-left: 10px;
  margin-right: 10px;
`;

const DirChooser = styled.div.attrs(() => ({
  className: "form-inline",
}))`
  margin: 10px;
  display: flex;
  justify-content: space-between;
`;

const Progress = styled.div`
  margin-left: 10px;
`;

const ShowError = styled.div`
  margin-left: 10px;
`;

const ErrorMessage = styled.span`
  color: red;
  font-weight: bold;
`;

const ViewerMain = styled.div`
  display: flex;
  justify-content: space-around;
`;

const ViewerSelector = styled.div`
  display: flex;
  justify-content: space-around;
  margin: 10px;
`;

const SelectorImg = styled.img`
  height: 240px;
  cursor: pointer;
`;

const SelectedSelectorImg = styled(SelectorImg)`
  border: solid;
  border-width: 2px;
  border-color: #999;
`;

const ViewedImg = styled.img`
  max-width: 100%;
  height: auto;
`;

const EmptyResult = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  font-size: 1.5rem;
  margin-top: 64px;
`;

const PageController = styled.div`
  display: flex;
  justify-content: center;
`;

interface Interm {
  path: string;
  total: number;
  finished: number;
}

type ViewerMode =
  | {
      enabled: false;
      prevX?: number;
      prevY?: number;
    }
  | {
      enabled: true;
      i: number;
      j: number;
      prevX: number;
      prevY: number;
      initEnabled: boolean;
    };

type ErrorDetail =
  | { code: "isnotdirectory" }
  | { code: "enoent" }
  | { code: "javaisnotinstalled" }
  | { code: "internal"; error: string | Error };

const renderErrorDetail = (ed: ErrorDetail) => {
  let str;
  if (ed.code === "isnotdirectory") {
    str = I18n.errorNotDirectory;
  } else if (ed.code === "enoent") {
    str = I18n.errorNoEnt;
  } else if (ed.code === "javaisnotinstalled") {
    str = I18n.errorJava;
  } else if (ed.code === "internal") {
    str = I18n.errorInternal;
  }

  let detail = "";
  if (ed.code === "internal") {
    if (ed.error instanceof Error) {
      detail = ed.error.name + "\n" + ed.error.message + "\n" + ed.error.stack;
    } else {
      detail = ed.error;
    }
  }

  const detailArea =
    ed.code === "internal" ? (
      <div className="form-group">
        <textarea
          className="form-control"
          rows={15}
          disabled={true}
          value={detail}
        />
      </div>
    ) : (
      ""
    );

  return (
    <ShowError>
      <div>
        <ErrorMessage>{str}</ErrorMessage>
        {detailArea}
      </div>
    </ShowError>
  );
};

type PageInfo = {
  imageFileCount: number;
  page: number;
  dirPath: string;
};

const App: React.FC = () => {
  const [dirPath, setDirPath] = useState("");
  const [running, setRunning] =
    useState<"init" | "starting" | "started" | "finish" | "error">("init");
  const [interm, setInterm] = useState<null | Interm>(null);
  const [imageFiles, setImageFiles] = useState<ImageFile[][]>([]);
  const [viewerMode, setViewerMode] = useState<ViewerMode>({
    enabled: false,
  });
  const [algo, setAlgo] = useState(algos[0]);
  const [errorDetail, setErrorDetail] = useState<null | ErrorDetail>(null);
  const [pageInfo, setPageInfo] = useState<PageInfo>({
    imageFileCount: 0,
    page: 1,
    dirPath: "",
  });

  async function clickDirectoryChooseButton() {
    const dir = await window.gahi.chooseDirectory();
    dir.canceled || setDirPath(dir.filePaths[0]);
  }

  useEffect(() => {
    const listener = (_e: any, d: any) => {
      setInterm(d);
    };
    window.gahi.cli.addIntermListenser(listener);
    const resultsListener = async (_e: any, d: any) => {
      setViewerMode({ enabled: false });
      setPageInfo({
        imageFileCount: d.imageFileCount,
        page: 1,
        dirPath: d.dirPath,
      });
      setRunning("finish");
      setInterm(null);
    };
    window.gahi.cli.addResultsListenser(resultsListener);
    const errorListener = (_e: any, d: any) => {
      setErrorDetail(d);
      setRunning("error");
    };
    window.gahi.cli.addErrorListenser(errorListener);

    const dropListener = (e: DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer?.files[0] as any; // path attribute isn't exist in File API https://developer.mozilla.org/en-US/docs/Web/API/File
      if (file && file.path) {
        setDirPath(file.path);
      }
    };
    window.document.addEventListener("drop", dropListener);
    return () => {
      window.gahi.cli.removeIntermListenser(listener);
      window.gahi.cli.removeResultsListenser(resultsListener);
      window.gahi.cli.removeErrorListenser(errorListener);
      window.document.removeEventListener("drop", dropListener);
    };
  }, []);

  useEffect(() => {
    if (running === "starting") {
      window.gahi.cli.start(dirPath, algo);
      setRunning("started");
    }
  }, [running, dirPath, algo]);

  useEffect(() => {
    const func = async () => {
      const ifs = await window.gahi.cli.fetchImagefiles(
        (pageInfo.page - 1) * 10,
        10
      );
      setImageFiles(ifs);
    };
    func();
  }, [pageInfo]);

  useLayoutEffect(() => {
    if (
      viewerMode.enabled === false &&
      viewerMode.prevX !== undefined &&
      viewerMode.prevY !== undefined
    ) {
      window.scrollTo(viewerMode.prevX, viewerMode.prevY);
    } else if (viewerMode.enabled === true && viewerMode.initEnabled === true) {
      window.scrollTo(viewerMode.prevX, 0);
    }
  }, [viewerMode]);

  return viewerMode.enabled ? (
    <div
      onClick={() => {
        setViewerMode((v) => ({
          enabled: false,
          prevX: v.prevX,
          prevY: v.prevY,
        }));
      }}
    >
      <ViewerSelector>
        {imageFiles[viewerMode.i].map((img, k) =>
          k === viewerMode.j ? (
            <SelectedSelectorImg
              key={img.path}
              src={img.path}
              alt={img.name}
              onClick={(e) => {
                e.stopPropagation();
              }}
            />
          ) : (
            <SelectorImg
              key={img.path}
              src={img.path}
              alt={img.name}
              onClick={(e) => {
                e.stopPropagation();
                setViewerMode((v) => ({ ...v, j: k, initEnabled: false }));
              }}
            />
          )
        )}
      </ViewerSelector>
      <ViewerMain>
        <ViewedImg src={imageFiles[viewerMode.i][viewerMode.j].path} />
      </ViewerMain>
    </div>
  ) : (
    <div>
      <DirChooser>
        <button
          onClick={clickDirectoryChooseButton}
          className="btn btn-secondary"
        >
          {I18n.chooseDirectory}
        </button>
        <DirText value={dirPath} onChange={(e) => setDirPath(e.target.value)} />
        <label htmlFor="algoselect">{I18n.algo}</label>
        <AlgoSelect
          className="form-control"
          id="algoselect"
          value={algo}
          onChange={(e) => setAlgo(e.target.value)}
        >
          {algos.map((a) => (
            <option key={a}>{a}</option>
          ))}
        </AlgoSelect>
        <button
          className="btn btn-primary"
          disabled={
            dirPath === "" || running === "starting" || running === "started"
          }
          onClick={() => {
            setRunning("starting");
          }}
        >
          {I18n.startSearch}
        </button>
      </DirChooser>
      <Progress>
        {interm !== null && running === "started"
          ? `${Math.floor((100 * interm.finished) / interm.total)}%  ${
              interm.path
            }`
          : ""}
      </Progress>
      {running === "error" && errorDetail !== null
        ? renderErrorDetail(errorDetail)
        : ""}
      <div>
        {pageInfo.imageFileCount === 0 && running === "finish" ? (
          <EmptyResult>
            <div>
              <FcApproval />
            </div>
            <div>{I18n.duplicatedFileIsNotFound}</div>
          </EmptyResult>
        ) : (
          <div>
            <div>
              {imageFiles.map((sims, i) => {
                return (
                  <Similars
                    similars={sims}
                    key={dirPath + sims[0].name}
                    onSelectImage={(j) => () =>
                      setViewerMode({
                        enabled: true,
                        i,
                        j,
                        prevX: window.scrollX,
                        prevY: window.scrollY,
                        initEnabled: true,
                      })}
                    onClickDeleteButton={(j) => async () => {
                      const isApprove = await window.gahi.deleteDialog(
                        I18n.deleteDialogMessage(sims[j].name),
                        I18n.deleteDialogDetail,
                        I18n.deleteDialogOk,
                        I18n.deleteDialogCancel
                      );
                      if (isApprove) {
                        window.gahi.moveToTrash(sims[j].path);
                        setImageFiles((imf) =>
                          imf.map((x, xi) =>
                            i !== xi ? x : x.filter((_y, yj) => yj !== j)
                          )
                        );
                      }
                    }}
                  />
                );
              })}
            </div>
            {pageInfo.imageFileCount === 0 ? (
              ""
            ) : (
              <PageController>
                <ReactPaginate
                  previousLabel={"<"}
                  nextLabel={">"}
                  breakLabel="..."
                  pageCount={
                    // This formula reprensenting
                    //  0-10: 1
                    // 11-20: 2
                    // 21-30: 3
                    // ...
                    pageInfo.imageFileCount === 0
                      ? 1
                      : Math.floor((pageInfo.imageFileCount - 1) / 10) + 1
                  }
                  marginPagesDisplayed={2}
                  pageRangeDisplayed={5}
                  onPageChange={(d) => {
                    console.log(d);
                    // prevent reset ImageFiles when transit from viewer mode
                    if (d.selected + 1 !== pageInfo.page) {
                      setImageFiles([]);
                      setPageInfo((p) => {
                        return { ...p, ...{ page: d.selected + 1 } };
                      });
                    }
                  }}
                  forcePage={pageInfo.page - 1}
                  // For Bootstrap 4
                  containerClassName="pagination"
                  pageClassName="page-item"
                  pageLinkClassName="page-link"
                  activeClassName="active"
                  previousClassName="page-item"
                  nextClassName="page-item"
                  previousLinkClassName="page-link"
                  nextLinkClassName="page-link"
                  disabledClassName="disabled"
                  breakClassName="page-item"
                  breakLinkClassName="page-link"
                />
              </PageController>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
