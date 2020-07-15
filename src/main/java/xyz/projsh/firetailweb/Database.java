package xyz.projsh.firetailweb;

import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoClients;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoDatabase;
import static com.mongodb.client.model.Filters.eq;
import com.mpatric.mp3agic.ID3v2;
import com.mpatric.mp3agic.InvalidDataException;
import com.mpatric.mp3agic.Mp3File;
import com.mpatric.mp3agic.UnsupportedTagException;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.logging.Level;
import java.util.logging.Logger;
import org.bson.Document;

public class Database {

    public MongoClient mongodb;
    public MongoDatabase db;
    public static MongoCollection<Document> songs;
    public static MongoCollection<Document> userSettings;
    public static String dataDir;
    
    private static String[] getMetadata(String fileLoc) {
        String[] songMetadata = new String[3];
        Thread getMetadata = new Thread(() -> {
            try {
                Mp3File mp3file = new Mp3File(fileLoc);
                if (mp3file.hasId3v2Tag()) {
                    ID3v2 tag = mp3file.getId3v2Tag();
                    songMetadata[0] = tag.getTitle();
                    songMetadata[1] = tag.getArtist();
                    songMetadata[2] = tag.getAlbum();
                    if (songMetadata[0] == null) {
                        songMetadata[0] = fileLoc.substring(0, fileLoc.length() - 4);
                    }
                    if (songMetadata[1] == null) {
                        songMetadata[1] = "Unknown Artist";
                    }
                    if (songMetadata[2] == null) {
                        songMetadata[2] = "Unknown Album";
                    }
                    /*byte[] img = tag.getAlbumImage();
                    if (img != null) {
                        ImageIcon icon = new ImageIcon(img);
                        Image image = icon.getImage();
                        Image scaledImg = image.getScaledInstance(128, 128, Image.SCALE_SMOOTH);
                        icon = new ImageIcon(scaledImg);
                    }*/
                }
            } catch (IOException ex) {
                Logger.getLogger(Database.class.getName()).log(Level.SEVERE, null, ex);
            } catch (UnsupportedTagException ex) {
                Logger.getLogger(Database.class.getName()).log(Level.SEVERE, null, ex);
            } catch (InvalidDataException ex) {
                Logger.getLogger(Database.class.getName()).log(Level.SEVERE, null, ex);
            }
        });
        getMetadata.start();
        try {
            getMetadata.join();
        } catch (InterruptedException ex) {
            Logger.getLogger(Database.class.getName()).log(Level.SEVERE, null, ex);
        }
        return songMetadata;
    }
    
    public Database() {
        //connect to mongodb. if firetailweb db doesn't exist, mongodb will auto create it
        mongodb = MongoClients.create("mongodb://localhost:27017");
        db = mongodb.getDatabase("firetailweb");
        songs = db.getCollection("songs");
        userSettings = db.getCollection("settings");
        try {
            dataDir = userSettings.find().first().getString("userDir");
        } catch(NullPointerException err) {
            new File(String.format("%s/.firetail-web/songs", System.getProperty("user.home"))).mkdirs();
            Document newSettings = new Document("userDir", String.format("%s/.firetail-web/songs/", System.getProperty("user.home")));
            userSettings.insertOne(newSettings);
            dataDir = userSettings.find().first().getString("userDir");
        }
    }
    
    public static String getSong(String id) {
        Document song = songs.find(eq("_id", id)).first();
        return song.toJson();
    }
    
    public static void addSong(File file) {
        String fileLoc = dataDir + "/" + file.getName();
        try {
            byte[] fileData = Files.readAllBytes(Paths.get(file.getAbsolutePath()));
            File newFile = new File(fileLoc);
            newFile.createNewFile();
            try {
                FileOutputStream writeFile = new FileOutputStream(newFile.getAbsolutePath());
                writeFile.write(fileData);
                writeFile.close();
                System.out.println("Wrote file! " + dataDir);
            } catch(IOException err) {
                System.out.println("Unable to save file...");
                err.printStackTrace();
            }
        } catch(IOException err) {
            
        }
        String[] songMetadata = getMetadata(fileLoc);
        Document newSong = new Document("title", songMetadata[0])
                .append("artist", songMetadata[1])
                .append("album", songMetadata[2])
                .append("location", fileLoc)
                .append("fileName", file.getName());
        songs.insertOne(newSong);
    }

}
