# Gahi CLI

A command-line image simirality checker powered by LIRE.

## Usage (On Windows)

### Build

```
> .\gradlew.bat distZip
```

Artifacts are built in `.\build\distributions`

### Running

```
> .\gahi-cli.bat dup C:\images\
[["C:\images\001.png","C:\images\002.png"],["C:\images\101.png","C:\images\102.png","C:\images\103.png"]
```

#### Side effects

`temp_index` direactory is created at the current directory. Indexing data are in the directory.

## LICENSE

GPL v2.0

Because the license of LIRE is GPL v2.0.

## Internal steps

1. Gahi creates `temp_index` at the current directory if it doesn' exist.
2. Gahi removes all files in `temp_index`.
3. Gahi creates index files for target dir.
4. Gahi applies `dup` or `search` to index files.