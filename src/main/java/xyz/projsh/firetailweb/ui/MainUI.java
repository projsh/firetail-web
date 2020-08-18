package xyz.projsh.firetailweb.ui;

import com.formdev.flatlaf.*;
import com.mongodb.client.FindIterable;
import static com.mongodb.client.model.Filters.eq;
import java.awt.Desktop;
import java.awt.Dimension;
import java.awt.Image;
import java.awt.event.MouseEvent;
import java.awt.event.WindowAdapter;
import java.awt.event.WindowEvent;
import java.io.File;
import java.io.IOException;
import java.net.InetAddress;
import java.net.URI;
import java.net.URISyntaxException;
import java.net.UnknownHostException;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.logging.Level;
import java.util.logging.Logger;
import java.util.prefs.Preferences;
import javax.swing.Action;
import javax.swing.DefaultListModel;
import javax.swing.ImageIcon;
import javax.swing.JFileChooser;
import javax.swing.JTabbedPane;
import javax.swing.SwingUtilities;
import javax.swing.UIManager;
import javax.swing.UnsupportedLookAndFeelException;
import org.bson.Document;
import xyz.projsh.firetailweb.Database;
import xyz.projsh.firetailweb.FiretailWeb;

/*
    This class handles the server's gui.
*/
public class MainUI extends javax.swing.JFrame {
    
    //link variable is for the web app url and the prefs is for java's preferences thingy
    private String link = "";
    private Preferences prefs = Preferences.userNodeForPackage(this.getClass());
    
    /*
        this initialises the frame, sets the look and feel, sets the web app url,
        sets the firetail icon, 
    */
    public MainUI() {
        updateLaF();
        initComponents();
        if (prefs.get("theme", "light").equals("dark")) {
            themeCombo.setSelectedIndex(1);
        }
        String ip = "";
        try {
            ip = InetAddress.getLocalHost().getHostAddress();
        } catch (UnknownHostException ex) {
            Logger.getLogger(MainUI.class.getName()).log(Level.SEVERE, null, ex);
        }
        link = String.format("http://%s:8080", ip);
        ipString.setText(String.format("<html><a href=\"\">http://%s:8080</a></html>", ip));
        addSongLabel.setPreferredSize(new Dimension(170, 19));
        addSongLabel.setMaximumSize(new Dimension(170, 19));
        addSongLabel.setVisible(false);
        filesProgBar.setVisible(false);
        verLabel.setText(FiretailWeb.versionString);
        setLocationRelativeTo(null);
        addWindowListener(new WindowAdapter() {
            @Override
            public void windowClosing(WindowEvent ev) {
                setState(ICONIFIED);
            }
        });
        try {
            byte[] ftIconBytes = {};
            try {
                String iconPath = this.getClass().getClassLoader().getResource("static/assets/firetail.png").toURI().getPath();
                if (System.getProperty("os.name").toLowerCase().contains("win")) {
                    iconPath = iconPath.substring(1, iconPath.length());
                }
                ftIconBytes = Files.readAllBytes(Paths.get(iconPath));
                ImageIcon icon = new ImageIcon(ftIconBytes);
                Image image = icon.getImage();
                Image scaledImg = image.getScaledInstance(75, 75, Image.SCALE_SMOOTH);
                icon = new ImageIcon(scaledImg);
                ftIcon.setIcon(icon);
            } catch (URISyntaxException ex) {
                Logger.getLogger(MainUI.class.getName()).log(Level.SEVERE, null, ex);
            }
            
        } catch (Exception ex) {
            Logger.getLogger(MainUI.class.getName()).log(Level.SEVERE, null, ex);
        }
        /*
            this just listens for when the tabbed pane changes, then if the selected one is
            songs, update the list
        */
        mainTabPane.addChangeListener(e -> {
            JTabbedPane pane = (JTabbedPane) e.getSource();
            if (pane.getTitleAt(pane.getSelectedIndex()).equals("Songs")) {
                updateSongList();
            }
        });
    }
    
    /*
        this updates the server's gui theme in real time without recreating the frame
    */
    public void updateLaF() {
        try {
            if (prefs.get("theme", "light").equals("light")) {
                UIManager.setLookAndFeel(new FlatIntelliJLaf());
            } else {
                UIManager.setLookAndFeel(new FlatDarculaLaf());
            }
        } catch (UnsupportedLookAndFeelException ex) {
            Logger.getLogger(MainUI.class.getName()).log(Level.SEVERE, null, ex);
        }
        SwingUtilities.updateComponentTreeUI(this);
    }
    
    /*
        this will open the default browser with the link provided.
        used for the gui's web app link
    */
    private void openLink(URI link) {
        if (Desktop.isDesktopSupported()) {
            try {
                Desktop.getDesktop().browse(link);
            } catch (IOException ex) {
                Logger.getLogger(MainUI.class.getName()).log(Level.SEVERE, null, ex);
            }
        } else { }
    }
    
    /*
        updates the song list by searching the database and pushing every available
        song to the list
    */
    private void updateSongList() {
        DefaultListModel listModel = new DefaultListModel();
        FindIterable<Document> songs = Database.songs.find();
        for (Document song : songs) {
            String fileName = song.getString("fileName");
            listModel.addElement(fileName);
        }
        listSongs.setModel(listModel);
    }

    /**
     * This method is called from within the constructor to initialize the form.
     * WARNING: Do NOT modify this code. The content of this method is always
     * regenerated by the Form Editor.
     */
    @SuppressWarnings("unchecked")
    // <editor-fold defaultstate="collapsed" desc="Generated Code">//GEN-BEGIN:initComponents
    private void initComponents() {

        mainTabPane = new javax.swing.JTabbedPane();
        jPanel1 = new javax.swing.JPanel();
        jLabel4 = new javax.swing.JLabel();
        jLabel6 = new javax.swing.JLabel();
        ipString = new javax.swing.JLabel();
        themeCombo = new javax.swing.JComboBox<>();
        jSeparator1 = new javax.swing.JSeparator();
        jLabel7 = new javax.swing.JLabel();
        jPanel2 = new javax.swing.JPanel();
        jScrollPane1 = new javax.swing.JScrollPane();
        listSongs = new javax.swing.JList<>();
        addSongsButton = new javax.swing.JButton();
        updateListButton = new javax.swing.JButton();
        addSongLabel = new javax.swing.JLabel();
        dropSongsButton = new javax.swing.JButton();
        filesProgBar = new javax.swing.JProgressBar();
        jPanel3 = new javax.swing.JPanel();
        jLabel1 = new javax.swing.JLabel();
        jLabel2 = new javax.swing.JLabel();
        ftIcon = new javax.swing.JLabel();
        verLabel = new javax.swing.JLabel();
        exitButton = new javax.swing.JButton();

        setDefaultCloseOperation(javax.swing.WindowConstants.DO_NOTHING_ON_CLOSE);
        setTitle("Firetail Web");
        setMinimumSize(new java.awt.Dimension(350, 250));

        jLabel4.setFont(jLabel4.getFont().deriveFont(jLabel4.getFont().getStyle() | java.awt.Font.BOLD, 24));
        jLabel4.setText("Server is active!");

        jLabel6.setText("Web app link:");

        ipString.setText("unknown");
        ipString.setCursor(new java.awt.Cursor(java.awt.Cursor.HAND_CURSOR));
        ipString.addMouseListener(new java.awt.event.MouseAdapter() {
            public void mouseClicked(java.awt.event.MouseEvent evt) {
                ipStringMouseClicked(evt);
            }
        });

        themeCombo.setModel(new javax.swing.DefaultComboBoxModel<>(new String[] { "Light", "Dark" }));
        themeCombo.addActionListener(new java.awt.event.ActionListener() {
            public void actionPerformed(java.awt.event.ActionEvent evt) {
                themeComboActionPerformed(evt);
            }
        });

        jLabel7.setText("Theme");

        javax.swing.GroupLayout jPanel1Layout = new javax.swing.GroupLayout(jPanel1);
        jPanel1.setLayout(jPanel1Layout);
        jPanel1Layout.setHorizontalGroup(
            jPanel1Layout.createParallelGroup(javax.swing.GroupLayout.Alignment.LEADING)
            .addComponent(jSeparator1)
            .addGroup(jPanel1Layout.createSequentialGroup()
                .addGap(17, 17, 17)
                .addGroup(jPanel1Layout.createParallelGroup(javax.swing.GroupLayout.Alignment.LEADING)
                    .addComponent(jLabel4, javax.swing.GroupLayout.PREFERRED_SIZE, 298, javax.swing.GroupLayout.PREFERRED_SIZE)
                    .addGroup(jPanel1Layout.createSequentialGroup()
                        .addComponent(jLabel6)
                        .addPreferredGap(javax.swing.LayoutStyle.ComponentPlacement.RELATED)
                        .addComponent(ipString, javax.swing.GroupLayout.PREFERRED_SIZE, 217, javax.swing.GroupLayout.PREFERRED_SIZE))
                    .addGroup(jPanel1Layout.createParallelGroup(javax.swing.GroupLayout.Alignment.TRAILING, false)
                        .addComponent(jLabel7, javax.swing.GroupLayout.Alignment.LEADING, javax.swing.GroupLayout.DEFAULT_SIZE, javax.swing.GroupLayout.DEFAULT_SIZE, Short.MAX_VALUE)
                        .addComponent(themeCombo, javax.swing.GroupLayout.Alignment.LEADING, 0, 116, Short.MAX_VALUE)))
                .addContainerGap(198, Short.MAX_VALUE))
        );
        jPanel1Layout.setVerticalGroup(
            jPanel1Layout.createParallelGroup(javax.swing.GroupLayout.Alignment.LEADING)
            .addGroup(jPanel1Layout.createSequentialGroup()
                .addContainerGap()
                .addComponent(jLabel4)
                .addPreferredGap(javax.swing.LayoutStyle.ComponentPlacement.RELATED)
                .addGroup(jPanel1Layout.createParallelGroup(javax.swing.GroupLayout.Alignment.BASELINE)
                    .addComponent(jLabel6)
                    .addComponent(ipString))
                .addPreferredGap(javax.swing.LayoutStyle.ComponentPlacement.UNRELATED)
                .addComponent(jSeparator1, javax.swing.GroupLayout.PREFERRED_SIZE, 10, javax.swing.GroupLayout.PREFERRED_SIZE)
                .addPreferredGap(javax.swing.LayoutStyle.ComponentPlacement.RELATED)
                .addComponent(jLabel7)
                .addPreferredGap(javax.swing.LayoutStyle.ComponentPlacement.RELATED)
                .addComponent(themeCombo, javax.swing.GroupLayout.PREFERRED_SIZE, javax.swing.GroupLayout.DEFAULT_SIZE, javax.swing.GroupLayout.PREFERRED_SIZE)
                .addContainerGap(137, Short.MAX_VALUE))
        );

        themeCombo.getAccessibleContext().setAccessibleName("Theme");

        mainTabPane.addTab("Settings", jPanel1);

        listSongs.setSelectionMode(javax.swing.ListSelectionModel.SINGLE_SELECTION);
        listSongs.addMouseListener(new java.awt.event.MouseAdapter() {
            public void mouseClicked(java.awt.event.MouseEvent evt) {
                listSongsMouseClicked(evt);
            }
        });
        jScrollPane1.setViewportView(listSongs);

        addSongsButton.setText("Add songs");
        addSongsButton.addActionListener(new java.awt.event.ActionListener() {
            public void actionPerformed(java.awt.event.ActionEvent evt) {
                addSongsButtonActionPerformed(evt);
            }
        });

        updateListButton.setText("Update List");
        updateListButton.addActionListener(new java.awt.event.ActionListener() {
            public void actionPerformed(java.awt.event.ActionEvent evt) {
                updateListButtonActionPerformed(evt);
            }
        });

        addSongLabel.setText("Adding to database...");

        dropSongsButton.setText("Drop Songs");
        dropSongsButton.addActionListener(new java.awt.event.ActionListener() {
            public void actionPerformed(java.awt.event.ActionEvent evt) {
                dropSongsButtonActionPerformed(evt);
            }
        });

        javax.swing.GroupLayout jPanel2Layout = new javax.swing.GroupLayout(jPanel2);
        jPanel2.setLayout(jPanel2Layout);
        jPanel2Layout.setHorizontalGroup(
            jPanel2Layout.createParallelGroup(javax.swing.GroupLayout.Alignment.LEADING)
            .addGroup(jPanel2Layout.createSequentialGroup()
                .addContainerGap()
                .addGroup(jPanel2Layout.createParallelGroup(javax.swing.GroupLayout.Alignment.LEADING)
                    .addComponent(jScrollPane1, javax.swing.GroupLayout.Alignment.TRAILING)
                    .addGroup(javax.swing.GroupLayout.Alignment.TRAILING, jPanel2Layout.createSequentialGroup()
                        .addComponent(filesProgBar, javax.swing.GroupLayout.DEFAULT_SIZE, 182, Short.MAX_VALUE)
                        .addPreferredGap(javax.swing.LayoutStyle.ComponentPlacement.RELATED)
                        .addComponent(dropSongsButton)
                        .addPreferredGap(javax.swing.LayoutStyle.ComponentPlacement.RELATED)
                        .addComponent(updateListButton)
                        .addPreferredGap(javax.swing.LayoutStyle.ComponentPlacement.RELATED)
                        .addComponent(addSongsButton))
                    .addGroup(jPanel2Layout.createSequentialGroup()
                        .addComponent(addSongLabel, javax.swing.GroupLayout.PREFERRED_SIZE, 480, javax.swing.GroupLayout.PREFERRED_SIZE)
                        .addGap(0, 0, Short.MAX_VALUE)))
                .addContainerGap())
        );
        jPanel2Layout.setVerticalGroup(
            jPanel2Layout.createParallelGroup(javax.swing.GroupLayout.Alignment.LEADING)
            .addGroup(jPanel2Layout.createSequentialGroup()
                .addContainerGap()
                .addComponent(addSongLabel)
                .addPreferredGap(javax.swing.LayoutStyle.ComponentPlacement.RELATED)
                .addComponent(jScrollPane1, javax.swing.GroupLayout.DEFAULT_SIZE, 202, Short.MAX_VALUE)
                .addPreferredGap(javax.swing.LayoutStyle.ComponentPlacement.RELATED)
                .addGroup(jPanel2Layout.createParallelGroup(javax.swing.GroupLayout.Alignment.LEADING)
                    .addComponent(filesProgBar, javax.swing.GroupLayout.PREFERRED_SIZE, 22, javax.swing.GroupLayout.PREFERRED_SIZE)
                    .addGroup(jPanel2Layout.createParallelGroup(javax.swing.GroupLayout.Alignment.BASELINE)
                        .addComponent(addSongsButton)
                        .addComponent(updateListButton)
                        .addComponent(dropSongsButton)))
                .addContainerGap())
        );

        mainTabPane.addTab("Songs", jPanel2);

        jLabel1.setFont(jLabel1.getFont().deriveFont(jLabel1.getFont().getStyle() | java.awt.Font.BOLD, 36));
        jLabel1.setHorizontalAlignment(javax.swing.SwingConstants.LEFT);
        jLabel1.setText("<html>Firetail Web</html>");
        jLabel1.setBorder(javax.swing.BorderFactory.createEmptyBorder(5, 15, 0, 15));
        jLabel1.setHorizontalTextPosition(javax.swing.SwingConstants.CENTER);

        jLabel2.setHorizontalAlignment(javax.swing.SwingConstants.LEFT);
        jLabel2.setText("Copyright © 2020 projsh_");
        jLabel2.setBorder(javax.swing.BorderFactory.createEmptyBorder(5, 15, 5, 15));

        ftIcon.setBorder(javax.swing.BorderFactory.createEmptyBorder(10, 10, 10, 0));

        verLabel.setText("v0.0.0");
        verLabel.setBorder(javax.swing.BorderFactory.createEmptyBorder(0, 15, 0, 15));

        javax.swing.GroupLayout jPanel3Layout = new javax.swing.GroupLayout(jPanel3);
        jPanel3.setLayout(jPanel3Layout);
        jPanel3Layout.setHorizontalGroup(
            jPanel3Layout.createParallelGroup(javax.swing.GroupLayout.Alignment.LEADING)
            .addGroup(jPanel3Layout.createSequentialGroup()
                .addContainerGap()
                .addComponent(ftIcon)
                .addPreferredGap(javax.swing.LayoutStyle.ComponentPlacement.RELATED)
                .addGroup(jPanel3Layout.createParallelGroup(javax.swing.GroupLayout.Alignment.LEADING)
                    .addGroup(jPanel3Layout.createSequentialGroup()
                        .addComponent(verLabel)
                        .addGap(0, 0, Short.MAX_VALUE))
                    .addGroup(jPanel3Layout.createSequentialGroup()
                        .addComponent(jLabel1, javax.swing.GroupLayout.DEFAULT_SIZE, 446, Short.MAX_VALUE)
                        .addGap(48, 48, 48))
                    .addComponent(jLabel2, javax.swing.GroupLayout.DEFAULT_SIZE, javax.swing.GroupLayout.DEFAULT_SIZE, Short.MAX_VALUE))
                .addContainerGap())
        );
        jPanel3Layout.setVerticalGroup(
            jPanel3Layout.createParallelGroup(javax.swing.GroupLayout.Alignment.LEADING)
            .addGroup(jPanel3Layout.createSequentialGroup()
                .addContainerGap()
                .addGroup(jPanel3Layout.createParallelGroup(javax.swing.GroupLayout.Alignment.LEADING)
                    .addComponent(ftIcon)
                    .addGroup(jPanel3Layout.createSequentialGroup()
                        .addComponent(jLabel1, javax.swing.GroupLayout.PREFERRED_SIZE, javax.swing.GroupLayout.DEFAULT_SIZE, javax.swing.GroupLayout.PREFERRED_SIZE)
                        .addPreferredGap(javax.swing.LayoutStyle.ComponentPlacement.RELATED)
                        .addComponent(verLabel)
                        .addPreferredGap(javax.swing.LayoutStyle.ComponentPlacement.RELATED)
                        .addComponent(jLabel2)))
                .addContainerGap(159, Short.MAX_VALUE))
        );

        mainTabPane.addTab("About", jPanel3);

        exitButton.setText("Exit");
        exitButton.addActionListener(new java.awt.event.ActionListener() {
            public void actionPerformed(java.awt.event.ActionEvent evt) {
                exitButtonActionPerformed(evt);
            }
        });

        javax.swing.GroupLayout layout = new javax.swing.GroupLayout(getContentPane());
        getContentPane().setLayout(layout);
        layout.setHorizontalGroup(
            layout.createParallelGroup(javax.swing.GroupLayout.Alignment.LEADING)
            .addGroup(javax.swing.GroupLayout.Alignment.TRAILING, layout.createSequentialGroup()
                .addContainerGap(javax.swing.GroupLayout.DEFAULT_SIZE, Short.MAX_VALUE)
                .addComponent(exitButton)
                .addContainerGap())
            .addComponent(mainTabPane)
        );
        layout.setVerticalGroup(
            layout.createParallelGroup(javax.swing.GroupLayout.Alignment.LEADING)
            .addGroup(layout.createSequentialGroup()
                .addComponent(mainTabPane)
                .addPreferredGap(javax.swing.LayoutStyle.ComponentPlacement.RELATED)
                .addComponent(exitButton)
                .addContainerGap())
        );

        pack();
    }// </editor-fold>//GEN-END:initComponents
    
    /*
        simple exit button, self-explanitory
    */
    private void exitButtonActionPerformed(java.awt.event.ActionEvent evt) {//GEN-FIRST:event_exitButtonActionPerformed
        System.exit(0);
    }//GEN-LAST:event_exitButtonActionPerformed
    
    /*
        handles a double click event on the song list. it will open a new window
        containing the selected song's metadata
    */
    private void listSongsMouseClicked(java.awt.event.MouseEvent evt) {//GEN-FIRST:event_listSongsMouseClicked
        if (evt.getClickCount() == 2 && evt.getButton() == MouseEvent.BUTTON1) {
            int index = listSongs.locationToIndex(evt.getPoint());
            FindIterable<Document> songs = Database.songs.find(eq("fileName", listSongs.getModel().getElementAt(index)));
            String dir = "";
            for (Document song : songs) {
                dir = new File(song.getString("location")).getAbsolutePath();
                new MetadataUI(dir, listSongs.getModel().getElementAt(index)).setVisible(true);
                break;
            }
        }
    }//GEN-LAST:event_listSongsMouseClicked
    
    /*
        handles the add songs button. creates a file chooser and proceeds to 
        loop through them and add to the song database.
    */
    private void addSongsButtonActionPerformed(java.awt.event.ActionEvent evt) {//GEN-FIRST:event_addSongsButtonActionPerformed
        JFileChooser chooser = new JFileChooser();
        chooser.setDialogTitle("Choose audio files");
        chooser.setCurrentDirectory(new File(String.format("%s/Music/", System.getProperty("user.home"))));
        chooser.setMultiSelectionEnabled(true);
        Action details = chooser.getActionMap().get("viewTypeDetails");
        details.actionPerformed(null);
        if (chooser.showOpenDialog(this) == JFileChooser.APPROVE_OPTION) {
            addSongLabel.setVisible(true);
            filesProgBar.setVisible(true);
            Thread addSongs = new Thread(() -> {
                File[] files = chooser.getSelectedFiles();
                int num = 0;
                for (File file : files) {
                    addSongLabel.setText(String.format("Adding %s to library...", file.getName()));
                    Database.addSong(file);
                    filesProgBar.setValue(num * 100 / files.length);
                    ++num;
                }
                filesProgBar.setVisible(false);
                filesProgBar.setValue(0);
                updateSongList();
                addSongLabel.setVisible(false);
            });
            addSongs.start();
        }
    }//GEN-LAST:event_addSongsButtonActionPerformed
    
    //when the update list button is clicked, call updatesonglist
    private void updateListButtonActionPerformed(java.awt.event.ActionEvent evt) {//GEN-FIRST:event_updateListButtonActionPerformed
        updateSongList();
    }//GEN-LAST:event_updateListButtonActionPerformed
    
    //the same as above but also drops the songs collection (deletes it from the database)
    private void dropSongsButtonActionPerformed(java.awt.event.ActionEvent evt) {//GEN-FIRST:event_dropSongsButtonActionPerformed
        Database.songs.drop();
        updateSongList();
    }//GEN-LAST:event_dropSongsButtonActionPerformed
    
    //when the link is clicked open the default web browser
    private void ipStringMouseClicked(java.awt.event.MouseEvent evt) {//GEN-FIRST:event_ipStringMouseClicked
        try {
            openLink(new URI(link));
        } catch (URISyntaxException ex) {
            Logger.getLogger(MainUI.class.getName()).log(Level.SEVERE, null, ex);
        }
    }//GEN-LAST:event_ipStringMouseClicked
    
    //when the theme combo box is updated, check the clicked item and update the theme
    private void themeComboActionPerformed(java.awt.event.ActionEvent evt) {//GEN-FIRST:event_themeComboActionPerformed
        String selectedItem = themeCombo.getSelectedItem().toString();
        if (selectedItem.equals("Dark")) {
            prefs.put("theme", "dark");
        } else {
            prefs.put("theme", "light");
        }
        updateLaF();
    }//GEN-LAST:event_themeComboActionPerformed

    // Variables declaration - do not modify//GEN-BEGIN:variables
    private javax.swing.JLabel addSongLabel;
    private javax.swing.JButton addSongsButton;
    private javax.swing.JButton dropSongsButton;
    private javax.swing.JButton exitButton;
    private javax.swing.JProgressBar filesProgBar;
    private javax.swing.JLabel ftIcon;
    private javax.swing.JLabel ipString;
    private javax.swing.JLabel jLabel1;
    private javax.swing.JLabel jLabel2;
    private javax.swing.JLabel jLabel4;
    private javax.swing.JLabel jLabel6;
    private javax.swing.JLabel jLabel7;
    private javax.swing.JPanel jPanel1;
    private javax.swing.JPanel jPanel2;
    private javax.swing.JPanel jPanel3;
    private javax.swing.JScrollPane jScrollPane1;
    private javax.swing.JSeparator jSeparator1;
    private javax.swing.JList<String> listSongs;
    private javax.swing.JTabbedPane mainTabPane;
    private javax.swing.JComboBox<String> themeCombo;
    private javax.swing.JButton updateListButton;
    private javax.swing.JLabel verLabel;
    // End of variables declaration//GEN-END:variables
}
