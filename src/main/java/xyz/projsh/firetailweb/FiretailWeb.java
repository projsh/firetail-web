package xyz.projsh.firetailweb;

import xyz.projsh.firetailweb.ui.MainUI;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.logging.Level;
import java.util.logging.Logger;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.web.servlet.config.annotation.EnableWebMvc;

@SpringBootApplication
@EnableWebMvc
public class FiretailWeb {
    
    private static String[] args;
    private static ConfigurableApplicationContext context;
    
    public static String versionString = "v1.0.0";
    
    /*
        This method in conjunction with restart() will restart the server by sending 
        a GET request to /api/restart. Used if the user wishes to restart the server without
        relaunching the application.
    */
    public static void doRestart() {
        try {
            URL url = new URL("http://localhost:8080/api/restart");
            HttpURLConnection con = (HttpURLConnection) url.openConnection();
            con.setRequestMethod("GET");
            con.getInputStream();
        } catch (Exception ex) {
            Logger.getLogger(MainUI.class.getName()).log(Level.SEVERE, null, ex);
        }
    }
    
    
    /*
        This method is called when a GET request is sent to /api/restart.
        This will close the server context and create a new one, restarting the server
        without restarting the server
    */
    public static void restart() {
        context.close();
        FiretailWeb.context = SpringApplication.run(FiretailWeb.class, args);
    }
    
    /*
        The main method. This will connect and setup the MongoDB database,
        create the server context & run, then creates the server app GUI.
        If the launch arguments contain "-no-gui", the server app GUI will
        not be created.
    */
    public static void main(String[] args) {
        new Database();
	FiretailWeb.args = args;
        FiretailWeb.context = SpringApplication.run(FiretailWeb.class, args);
	System.setProperty("java.awt.headless", "false");
        System.getProperties().list(System.out);
	if (args.length > 0) {
            if (args[0].equals("-no-gui")) {
                
            } else {
                java.awt.EventQueue.invokeLater(new Runnable() {
                    public void run() {
                        new MainUI().setVisible(true);
                    }
                });
            }
        } else {
            java.awt.EventQueue.invokeLater(new Runnable() {
                public void run() {
                    new MainUI().setVisible(true);
                }
            });
        }
    }

}
