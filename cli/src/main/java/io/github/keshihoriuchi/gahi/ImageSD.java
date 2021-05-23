package io.github.keshihoriuchi.gahi;

import java.awt.image.BufferedImage;
import java.io.File;
import java.io.IOException;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.Callable;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.stream.IntStream;
import java.util.stream.Stream;
import javax.imageio.ImageIO;
import net.semanticmetadata.lire.builders.DocumentBuilder;
import net.semanticmetadata.lire.builders.GlobalDocumentBuilder;
import net.semanticmetadata.lire.imageanalysis.features.global.CEDD;
import net.semanticmetadata.lire.imageanalysis.features.global.EdgeHistogram;
import net.semanticmetadata.lire.imageanalysis.features.global.FCTH;
import net.semanticmetadata.lire.imageanalysis.features.global.ColorLayout;
import net.semanticmetadata.lire.imageanalysis.features.global.PHOG;
import net.semanticmetadata.lire.imageanalysis.features.global.JCD;
import net.semanticmetadata.lire.imageanalysis.features.global.Gabor;
import net.semanticmetadata.lire.imageanalysis.features.global.JpegCoefficientHistogram;
import net.semanticmetadata.lire.imageanalysis.features.global.Tamura;
import net.semanticmetadata.lire.imageanalysis.features.global.LuminanceLayout;
import net.semanticmetadata.lire.imageanalysis.features.global.OpponentHistogram;
import net.semanticmetadata.lire.imageanalysis.features.global.ScalableColor;
import net.semanticmetadata.lire.searchers.GenericFastImageSearcher;
import net.semanticmetadata.lire.searchers.ImageDuplicates;
import net.semanticmetadata.lire.searchers.ImageSearchHits;
import net.semanticmetadata.lire.searchers.ImageSearcher;
import net.semanticmetadata.lire.utils.FileUtils;
import net.semanticmetadata.lire.utils.LuceneUtils;
import org.apache.lucene.document.Document;
import org.apache.lucene.index.DirectoryReader;
import org.apache.lucene.index.IndexReader;
import org.apache.lucene.index.IndexWriter;
import org.apache.lucene.store.FSDirectory;
import org.json.JSONObject;

public class ImageSD {
    private final Path indexDir;
    private final File baseDir;
    private final boolean isRecursive = false;
    private final Class algo;

    public ImageSD(Path baseDir, Path indexDir, Class algo) {
        this.baseDir = baseDir.toFile();
        this.indexDir = indexDir;
        this.algo = algo;
    }

    public static Class getALGO(String algoStr) {
        if (algoStr == null) return null;
        if (algoStr.equals("CEDD")) return CEDD.class;
        if (algoStr.equals("EdgeHistogram")) return EdgeHistogram.class;
        if (algoStr.equals("FCTH")) return FCTH.class;
        if (algoStr.equals("ColorLayout")) return ColorLayout.class;
        if (algoStr.equals("PHOG")) return PHOG.class;
        if (algoStr.equals("JCD")) return JCD.class;
        if (algoStr.equals("Gabor")) return Gabor.class;
        if (algoStr.equals("JpegCoefficientHistogram")) return JpegCoefficientHistogram.class;
        if (algoStr.equals("Tamura")) return Tamura.class;
        if (algoStr.equals("LuminanceLayout")) return LuminanceLayout.class;
        if (algoStr.equals("OpponentHistogram")) return OpponentHistogram.class;
        if (algoStr.equals("ScalableColor")) return ScalableColor.class;
        return null;
    }

    public Stream<SimilarImage> compare(Path imgPath) throws IOException {
        BufferedImage img = ImageIO.read(imgPath.toFile());
        List<SimilarImage> result = new ArrayList<>();
        try (IndexReader ir = DirectoryReader.open(FSDirectory.open(indexDir))) {
            ImageSearcher searcher = new GenericFastImageSearcher(ir.numDocs(), algo);
            ImageSearchHits hits = searcher.search(img, ir);

            for (int i=0; i < hits.length(); i++) {
                Path path;
                path = Paths.get(ir.document(hits.documentID(i)).getField(DocumentBuilder.FIELD_NAME_IDENTIFIER).stringValue());
                result.add(new SimilarImage(hits.score(i), path));
            }
        }
        return result.stream();
    }

    public Stream<? extends List<String>> dup() throws IOException {
        Stream<? extends List<String>> result;
        try (IndexReader ir = DirectoryReader.open(FSDirectory.open(indexDir))) {
            ImageSearcher searcher = new GenericFastImageSearcher(ir.numDocs(), algo);
            ImageDuplicates id = searcher.findDuplicates(ir);
            int limit = (id == null) ? 0 : id.length();
            result = IntStream.iterate(0, i -> i + 1).limit(limit).mapToObj(i -> id.getDuplicate(i));
        }
        return result;
    }

    public void createIndex() throws IOException, InterruptedException {
        List<String> images = FileUtils.getAllImages(baseDir, isRecursive);
        int size = images.size();
        DocumentBuilder builder = new GlobalDocumentBuilder(algo);

        ExecutorService pool = Executors.newFixedThreadPool(Runtime.getRuntime().availableProcessors());
        try (IndexWriter iw = LuceneUtils.createIndexWriter(FSDirectory.open(indexDir), true, LuceneUtils.AnalyzerType.WhitespaceAnalyzer)) {
            List<Callable<String>> tasks = new ArrayList<>();
            for (int i = 0; i < size; i++) {
                Callable task = new CreateIndexTask(images.get(i), builder, iw, size);
                tasks.add(task);
            }
            pool.invokeAll(tasks);
        } finally {
            pool.shutdown();
        }
    }

    public void clearIndex() throws IOException {
        Util.cleanDir(indexDir);
    }

    public void printDocs() throws IOException {
        try (IndexReader reader = DirectoryReader.open(FSDirectory.open(indexDir))) {
            for (int i = 0; i < reader.maxDoc(); i++) {
                Document doc = reader.document(i);
//        System.out.println(doc.get("descriptorImageIdentifier"));
//      doc.getFields().forEach(f -> System.out.println(f.name()));
            }
        }
    }

    static class CreateIndexTask implements Callable<String> {
        final String imgPath;
        final DocumentBuilder builder;
        final IndexWriter iw;
        final int size;
        public CreateIndexTask(String imgPath, DocumentBuilder builder, IndexWriter iw, int size) {
            this.imgPath = imgPath;
            this.builder = builder;
            this.iw = iw;
            this.size = size;
        }

        public String call() {
            try {
                BufferedImage img = ImageIO.read(new File(imgPath));
                Document document = builder.createDocument(img, imgPath);
                iw.addDocument(document);
                JSONObject jo = new JSONObject();
                jo.put("type", "index_creating");
                jo.put("path", imgPath);
                jo.put("total", size);
                safePrintln(jo);
            } catch (RuntimeException | IOException e) {
                System.err.println(e);
            }
            return "";
        }
        private void safePrintln(JSONObject s) {
            synchronized (System.out) {
                System.out.println(s);
            }
        }
    }
}
