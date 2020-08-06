package xyz.projsh.firetailweb.api;

import java.util.List;

public class Playlist {
    
    private final String name;
    private final String desc;
    private final String imgData;
    private final List<GetSong> songs;
    private final String id;
    
    public Playlist(String name, String desc, String imgData, List<GetSong> songs, String id) {
        this.name = name;
        this.desc = desc;
        this.imgData = imgData;
        this.songs = songs;
        this.id = id;
    }
    
    public String getName() {
        return name;
    }
    
    public String getDesc() {
        return desc;
    }
    
    public String getImgData() {
        return imgData;
    }
    
    public List<GetSong> getSongs() {
        return songs;
    }
    
    public String getId() {
        return id;
    }
    
}
