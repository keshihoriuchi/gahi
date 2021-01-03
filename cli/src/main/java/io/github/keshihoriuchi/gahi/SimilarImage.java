package io.github.keshihoriuchi.gahi;

import java.nio.file.Path;
import org.json.JSONWriter;

public class SimilarImage implements Comparable<SimilarImage> {

    private final double score;
    private final Path path;

    public SimilarImage(double score, Path path) {
        this.score = score;
        this.path = path;
    }

    public double getScore() {
        return score;
    }

    public Path getPath() {
        return path;
    }

    public void writeJSON(JSONWriter writer) {
        writer.object()
                .key("path").value(path)
                .key("score").value(score)
                .endObject();
    }

    @Override
    public int compareTo(SimilarImage o) {
        return Double.compare(score, o.score);
    }

    @Override
    public String toString() {
        return "score: " + score + " path: " + path;
    }
}