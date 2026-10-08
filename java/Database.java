import java.sql.*;
import java.util.ArrayList;

/**
 * Database.java - JDBC connection and operations
 * Uses PreparedStatement for safe queries
 */
public class Database {
    // MySQL connection details (change these for your setup)
    private static final String URL = "jdbc:mysql://localhost:3306/smart_energy";
    private static final String USER = "root";
    private static final String PASSWORD = ""; // Set your MySQL password

    private Connection connection;

    /**
     * Connect to MySQL database
     */
    public void connect() {
        try {
            // Load MySQL JDBC driver
            Class.forName("com.mysql.cj.jdbc.Driver");
            connection = DriverManager.getConnection(URL, USER, PASSWORD);
            System.out.println("Connected to database successfully!");
        } catch (ClassNotFoundException e) {
            System.out.println("MySQL JDBC Driver not found.");
            System.out.println("Download from: https://dev.mysql.com/downloads/connector/j/");
        } catch (SQLException e) {
            System.out.println("Database connection failed: " + e.getMessage());
        }
    }

    /**
     * Close database connection
     */
    public void close() {
        try {
            if (connection != null && !connection.isClosed()) {
                connection.close();
                System.out.println("Database connection closed.");
            }
        } catch (SQLException e) {
            System.out.println("Error closing connection: " + e.getMessage());
        }
    }

    /**
     * Get all appliances from database
     */
    public ArrayList<Appliance> getAppliances() {
        ArrayList<Appliance> list = new ArrayList<>();
        String sql = "SELECT * FROM appliances";

        try {
            PreparedStatement stmt = connection.prepareStatement(sql);
            ResultSet rs = stmt.executeQuery();

            while (rs.next()) {
                Appliance a = new Appliance(
                    rs.getInt("id"),
                    rs.getString("name"),
                    rs.getString("type"),
                    rs.getString("room"),
                    rs.getDouble("power_watts"),
                    rs.getDouble("expected_hours"),
                    rs.getDouble("actual_hours")
                );
                a.setHealthScore(rs.getDouble("health_score"));
                a.setStatus(rs.getString("status"));
                list.add(a);
            }
            rs.close();
            stmt.close();
        } catch (SQLException e) {
            System.out.println("Error fetching appliances: " + e.getMessage());
        }
        return list;
    }

    /**
     * Add a new appliance
     */
    public boolean addAppliance(Appliance a) {
        String sql = "INSERT INTO appliances (name, type, room, power_watts, expected_hours, actual_hours, health_score, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";

        try {
            PreparedStatement stmt = connection.prepareStatement(sql);
            stmt.setString(1, a.getName());
            stmt.setString(2, a.getType());
            stmt.setString(3, a.getRoom());
            stmt.setDouble(4, a.getPowerWatts());
            stmt.setDouble(5, a.getExpectedHours());
            stmt.setDouble(6, a.getActualHours());
            stmt.setDouble(7, a.getHealthScore());
            stmt.setString(8, a.getStatus());

            int rows = stmt.executeUpdate();
            stmt.close();
            return rows > 0;
        } catch (SQLException e) {
            System.out.println("Error adding appliance: " + e.getMessage());
            return false;
        }
    }

    /**
     * Update an existing appliance
     */
    public boolean updateAppliance(Appliance a) {
        String sql = "UPDATE appliances SET name=?, type=?, room=?, power_watts=?, expected_hours=?, actual_hours=?, health_score=?, status=? WHERE id=?";

        try {
            PreparedStatement stmt = connection.prepareStatement(sql);
            stmt.setString(1, a.getName());
            stmt.setString(2, a.getType());
            stmt.setString(3, a.getRoom());
            stmt.setDouble(4, a.getPowerWatts());
            stmt.setDouble(5, a.getExpectedHours());
            stmt.setDouble(6, a.getActualHours());
            stmt.setDouble(7, a.getHealthScore());
            stmt.setString(8, a.getStatus());
            stmt.setInt(9, a.getId());

            int rows = stmt.executeUpdate();
            stmt.close();
            return rows > 0;
        } catch (SQLException e) {
            System.out.println("Error updating appliance: " + e.getMessage());
            return false;
        }
    }

    /**
     * Delete an appliance by ID
     */
    public boolean deleteAppliance(int id) {
        String sql = "DELETE FROM appliances WHERE id=?";

        try {
            PreparedStatement stmt = connection.prepareStatement(sql);
            stmt.setInt(1, id);
            int rows = stmt.executeUpdate();
            stmt.close();
            return rows > 0;
        } catch (SQLException e) {
            System.out.println("Error deleting appliance: " + e.getMessage());
            return false;
        }
    }

    /**
     * Get energy readings for a specific appliance
     */
    public ArrayList<Double> getEnergyReadings(int applianceId) {
        ArrayList<Double> readings = new ArrayList<>();
        String sql = "SELECT reading_kwh FROM energy_readings WHERE appliance_id=? ORDER BY reading_date";

        try {
            PreparedStatement stmt = connection.prepareStatement(sql);
            stmt.setInt(1, applianceId);
            ResultSet rs = stmt.executeQuery();

            while (rs.next()) {
                readings.add(rs.getDouble("reading_kwh"));
            }
            rs.close();
            stmt.close();
        } catch (SQLException e) {
            System.out.println("Error fetching readings: " + e.getMessage());
        }
        return readings;
    }

    /**
     * Check if connection is active
     */
    public boolean isConnected() {
        try {
            return connection != null && !connection.isClosed();
        } catch (SQLException e) {
            return false;
        }
    }
}
