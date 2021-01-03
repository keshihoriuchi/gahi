package io.github.keshihoriuchi.gahi;

import java.io.File;
import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.stream.Stream;

public class Util {
    public static void cleanDir(File dir) throws IOException {
        cleanDir(dir.toPath());
    }

    public static void cleanDir(Path dir) throws IOException {
        if (Files.exists(dir)) {
            try (Stream<Path> entries = Files.list(dir)) {
                entries.forEach(e -> {
                    try { Files.delete(e); } catch (IOException ex) { throw new UncheckedIOException(ex); }
                });
            }
        }
        else {
            Files.createDirectory(dir);
        }
    }
}