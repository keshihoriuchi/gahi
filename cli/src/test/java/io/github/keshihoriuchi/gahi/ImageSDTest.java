package io.github.keshihoriuchi.gahi;

import static io.github.keshihoriuchi.gahi.Util.cleanDir;
import java.io.IOException;
import java.net.URISyntaxException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import org.junit.Test;
import static org.junit.Assert.*;
import org.junit.Before;
import org.junit.matchers.JUnitMatchers;
import net.semanticmetadata.lire.imageanalysis.features.global.CEDD;

public class ImageSDTest {
    public Path rootDir;
    public Path indexDir;
    public Path baseDir;
    public Path stubDir;

    @Before
    public void setUp() throws URISyntaxException, IOException {
        rootDir = Paths.get(ImageSDTest.class.getResource("").toURI());
        indexDir = rootDir.resolve("indexdir");
        baseDir = rootDir.resolve("basedir");
        stubDir = rootDir.resolve("stubs");
        cleanDir(indexDir);
        cleanDir(baseDir);
    }

    @Test
    public void testCreateIndex_creates_some_index_files() throws Exception {
        putImages("001.png", "002.png", "003.png");
        ImageSD imageSD = new ImageSD(baseDir, indexDir, CEDD.class);
        imageSD.createIndex();
        long actual = Files.list(indexDir).count();
        assertTrue(actual > 0);
    }

//    @Test
//    public void testCreateIndex_creates_if_multibyte_named_file_is_included() throws Exception {
//        putImages("001.png", "002.png", "にほんご.png");
//        ImageSD imageSD = new ImageSD(baseDir, indexDir, CEDD.class);
//        imageSD.createIndex();
//        long actual = Files.list(indexDir).count();
//        assertTrue(actual > 0);
//    }

    @Test
    public void testCompare() throws Exception {
        putImages("001.png", "002.png", "003.png");
        ImageSD imageSD = new ImageSD(baseDir, indexDir, CEDD.class);
        imageSD.createIndex();
        Path arg = stubDir.resolve("001.png");
        List<SimilarImage> actual = imageSD.compare(arg).collect(Collectors.toList());
        Collections.sort(actual);
        assertThat(actual.get(0).getPath().toString(), JUnitMatchers.containsString("001.png"));
        assertEquals(3, actual.size());
        actual.forEach(i -> {
            assertTrue(i.getScore() >= 0.0);
            assertTrue(i.getPath() != null);
        });
    }

    @Test
    public void testDupWhenEmpty() throws Exception {
        putImages("001.png", "002.png", "003.png");
        ImageSD imageSD = new ImageSD(baseDir, indexDir, CEDD.class);
        imageSD.createIndex();
        Stream<? extends List<String>> imageGroups = imageSD.dup();
        assertEquals(0, imageGroups.count());
    }

    private void putImages(String... names) throws IOException {
        for (String n: names) {
            Files.copy(stubDir.resolve(n), baseDir.resolve(n));
        }
    }
}