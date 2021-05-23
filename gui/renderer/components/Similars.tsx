import React from "react";
import { DateTime, DateTimeFormatOptions, LocaleOptions } from "luxon";
import { ImageFile } from "../../src/types";
import styled from "styled-components";
import { BsTrash } from "react-icons/bs";

const Similars = styled.div`
  display: flex;
  justify-content: space-around;

  border: solid;
  border-width: 1px 0 0 0;
  border-color: #dddddd;

  padding: 20px;
`;

const SimilarCol = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const SimilarImage = styled.div`
  text-align: center;
  margin: 0 0 20px 0;
  & > img {
    height: 240px;
    cursor: pointer;
  }
`;

const SimilarMetadata = styled.ul`
  width: 240px;
  padding: 5px 0;
  margin: 10px;
  list-style: none;
  border-radius: 4px;

  overflow-y: hidden;
  overflow-x: scroll;

  line-height: 1.8em;
  white-space: nowrap;

  background-color: #eeeeee;
`;

const MetadataRow = styled.li<{ modifier: "max" | "min" | "normal" }>`
  padding: 0 10px;
  ${(props) => (props.modifier === "max" ? "background-color: #ccffcc;" : "")}
  ${(props) => (props.modifier === "min" ? "background-color: #ffcccc;" : "")}
`;

const DeleteDiv = styled.div`
  padding: 10px 0 0 0;
  margin: 0 0 10px 0;
  display: flex;
  justify-content: space-around;
`;

const DeleteButton = styled.button.attrs((_props) => ({
  className: "btn btn-warning",
  type: "button",
}))`
  /* padding: 6px 20px; */
`;

const DATETIME_FORMAT: DateTimeFormatOptions & LocaleOptions = {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
};

function transfromMetaDataModifiers(imageFiles: ImageFile[]) {
  const result: {
    [key: string]: "normal" | "min" | "max";
  }[] = imageFiles.map(() => ({}));

  const sortables: { [key: string]: (im: ImageFile) => number } = {
    widthHeight: (im: ImageFile) => im.width * im.height,
    size: (im: ImageFile) => im.size,
    birthtime: (im: ImageFile) => 0 - im.birthtime.valueOf(),
    mtime: (im: ImageFile) => 0 - im.mtime.valueOf(),
  };

  Object.keys(sortables).forEach((key) => {
    const values: number[] = imageFiles.map(sortables[key]);
    const max = Math.max(...values);
    const min = Math.min(...values);
    if (max === min) {
      result.forEach((o) => (o[key] = "normal"));
    } else {
      result.forEach((o, i) => {
        const v = values[i];
        if (max === v) o[key] = "max";
        else if (min === v) o[key] = "min";
        else o[key] = "normal";
      });
    }
  });
  return result;
}

export interface SimilarsProps {
  similars: ImageFile[];
  onSelectImage: (x: number) => () => void;
  onClickDeleteButton: (x: number) => () => void;
}
const SimilarsComponent: React.FC<SimilarsProps> = (props) => {
  const imageFiles = props.similars;
  const metaDataModifiers = transfromMetaDataModifiers(imageFiles);

  return (
    <Similars>
      {imageFiles.map((similar, i) => {
        return (
          <SimilarCol key={similar.name}>
            <SimilarImage>
              <img
                src={similar.path}
                alt={similar.name}
                onClick={props.onSelectImage(i)}
              />
            </SimilarImage>
            <SimilarMetadata>
              <MetadataRow modifier={"normal"}>{similar.name}</MetadataRow>
              <MetadataRow modifier={metaDataModifiers[i].widthHeight}>
                {`${similar.width}×${similar.height}`}
              </MetadataRow>
              <MetadataRow modifier={metaDataModifiers[i].size}>{`${
                similar.size / 1000
              } KB`}</MetadataRow>
              <MetadataRow modifier={metaDataModifiers[i].birthtime}>
                {DateTime.fromJSDate(similar.birthtime).toLocaleString(
                  DATETIME_FORMAT
                )}
              </MetadataRow>
              <MetadataRow modifier={metaDataModifiers[i].mtime}>
                {DateTime.fromJSDate(similar.mtime).toLocaleString(
                  DATETIME_FORMAT
                )}
              </MetadataRow>
            </SimilarMetadata>
            <DeleteDiv>
              <DeleteButton onClick={props.onClickDeleteButton(i)}>
                <BsTrash />
              </DeleteButton>
            </DeleteDiv>
          </SimilarCol>
        );
      })}
    </Similars>
  );
};

export default SimilarsComponent;
