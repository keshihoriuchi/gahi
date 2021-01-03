package io.github.keshihoriuchi.gahi;

import java.io.IOException;
import java.io.PrintWriter;
import java.nio.file.Paths;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Stream;
import net.semanticmetadata.lire.imageanalysis.features.global.EdgeHistogram;
import org.apache.commons.cli.*;
import org.apache.commons.math3.geometry.spherical.twod.Edge;
import org.json.JSONArray;
import org.json.JSONObject;
import org.json.JSONWriter;


public class Cli {
    private static ImageSD imageSD;

    public static void main(String[] args) throws IOException {
        CommandLineParser parser = new DefaultParser();
        final Options options = new Options();
        options.addOption(new Option("a", "algorithm", true, "Algorithm to classify image"));
        try {
            CommandLine cmd = parser.parse(options, args);
            Class algo = EdgeHistogram.class;
            String algoStr = cmd.getOptionValue("a");
            if (algoStr != null) {
                algo = ImageSD.getALGO(algoStr);
                if (algo == null) {
                    exit("invalid algorithm option");
                }
            }
            String[] parsedArgs = cmd.getArgs();
            if (parsedArgs.length == 0) {
                exit("Usage: java -jar gahi.jar <dup|search> <subcommand args>");
            }
            if (parsedArgs[0].equals("dup")) {
                if (parsedArgs.length < 2) {
                    exit("Usage: java -jar gahi.jar dup <dir>");
                }
                prepare(parsedArgs[1], algo);
                dup();
            }
            else if (parsedArgs[0].equals("search")) {
                if (parsedArgs.length < 3) {
                    exit("Usage: java -jar gahi.jar search <dir> <file>");
                }
                prepare(parsedArgs[1], algo);
                search(parsedArgs[2]);
            }
            else {
                exit("Usage: java -jar gahi.jar <dup|search> <subcommand args>");
            }
        } catch(ParseException e) {
            System.err.println(e);
            exit("internal error");
        }
    }

    static void prepare(String dir, Class algo) throws IOException {
        imageSD = new ImageSD(Paths.get(dir), Paths.get(".", "./temp_index"), algo);
        imageSD.clearIndex();
        imageSD.createIndex();
    }

    static void search(String target) throws IOException {
        Stream<SimilarImage> images = imageSD.compare(Paths.get(target));
        PrintWriter p = new PrintWriter(System.out);
        JSONWriter writer = new JSONWriter(p);
        writer.array();
        images.forEach((SimilarImage si) -> si.writeJSON(writer));
        writer.endArray();
        p.flush();
    }

    static void dup() throws IOException {
        Stream<? extends List<String>> imageGroups = imageSD.dup();
        JSONObject jo = new JSONObject();
        jo.put("type", "finish");
        JSONArray ja = new JSONArray();
        imageGroups.forEach(list -> ja.put(list));
        jo.put("results", ja);
        System.out.println(jo);
    }

    private static void exit(String e) {
        System.err.println(e);
        System.exit(1);
    }
}