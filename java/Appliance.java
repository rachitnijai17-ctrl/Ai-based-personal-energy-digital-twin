/**
 * Appliance.java - Represents an energy-consuming appliance
 * Demonstrates: Encapsulation (private fields + getters/setters)
 */
public class Appliance {
    // Private variables (Encapsulation)
    private int id;
    private String name;
    private String type;
    private String room;
    private double powerWatts;      // Power rating in Watts
    private double expectedHours;   // Expected usage hours per day
    private double actualHours;     // Actual usage hours per day
    private double healthScore;     // Health score 0-100
    private String status;          // Good, Monitor, Warning, Possible Fault

    // Constructor
    public Appliance(int id, String name, String type, String room,
                     double powerWatts, double expectedHours, double actualHours) {
        this.id = id;
        this.name = name;
        this.type = type;
        this.room = room;
        setPowerWatts(powerWatts);           // Uses setter for validation
        setExpectedHours(expectedHours);
        setActualHours(actualHours);
        this.healthScore = 100;
        this.status = "Good";
    }

    // --- Getters ---
    public int getId() { return id; }
    public String getName() { return name; }
    public String getType() { return type; }
    public String getRoom() { return room; }
    public double getPowerWatts() { return powerWatts; }
    public double getExpectedHours() { return expectedHours; }
    public double getActualHours() { return actualHours; }
    public double getHealthScore() { return healthScore; }
    public String getStatus() { return status; }

    // --- Setters with validation (Exception Handling) ---
    public void setId(int id) { this.id = id; }
    public void setName(String name) { this.name = name; }
    public void setType(String type) { this.type = type; }
    public void setRoom(String room) { this.room = room; }

    public void setPowerWatts(double powerWatts) {
        if (powerWatts < 0) {
            throw new IllegalArgumentException("Power cannot be negative: " + powerWatts);
        }
        this.powerWatts = powerWatts;
    }

    public void setExpectedHours(double expectedHours) {
        if (expectedHours < 0 || expectedHours > 24) {
            throw new IllegalArgumentException("Hours must be between 0 and 24: " + expectedHours);
        }
        this.expectedHours = expectedHours;
    }

    public void setActualHours(double actualHours) {
        if (actualHours < 0 || actualHours > 24) {
            throw new IllegalArgumentException("Hours must be between 0 and 24: " + actualHours);
        }
        this.actualHours = actualHours;
    }

    public void setHealthScore(double healthScore) {
        this.healthScore = Math.max(0, Math.min(100, healthScore));
    }

    public void setStatus(String status) { this.status = status; }

    // --- Energy Calculations ---

    /**
     * Calculate expected daily consumption
     * Formula: Energy (kWh) = Power (W) / 1000 × Hours
     * Example: 1000W × 2h = 1000/1000 × 2 = 2 kWh
     */
    public double calculateExpectedConsumption() {
        return (powerWatts / 1000.0) * expectedHours;
    }

    /**
     * Calculate actual daily consumption
     */
    public double calculateActualConsumption() {
        return (powerWatts / 1000.0) * actualHours;
    }

    /**
     * Calculate deviation percentage between actual and expected
     * Positive = consuming more than expected
     */
    public double calculateDeviation() {
        double expected = calculateExpectedConsumption();
        if (expected == 0) return 0;
        return ((calculateActualConsumption() - expected) / expected) * 100;
    }

    /**
     * Calculate daily cost
     * Cost = Energy × Tariff (default ₹8/kWh)
     */
    public double calculateCost(double tariff) {
        return calculateActualConsumption() * tariff;
    }

    @Override
    public String toString() {
        return name + " (" + powerWatts + "W) in " + room
             + " | Expected: " + String.format("%.2f", calculateExpectedConsumption()) + " kWh"
             + " | Actual: " + String.format("%.2f", calculateActualConsumption()) + " kWh"
             + " | Deviation: " + String.format("%.1f", calculateDeviation()) + "%";
    }
}
