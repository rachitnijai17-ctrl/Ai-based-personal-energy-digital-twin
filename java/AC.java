/**
 * AC.java - Subclass of Appliance (Demonstrates Inheritance)
 * AC has weather-related consumption adjustment
 */
public class AC extends Appliance {
    private double temperature;  // Current outdoor temperature
    private double humidity;     // Current humidity percentage

    // Constructor
    public AC(int id, String room, double powerWatts,
              double expectedHours, double actualHours) {
        // Call parent constructor (Inheritance)
        super(id, "AC", "Cooling", room, powerWatts, expectedHours, actualHours);
        this.temperature = 28; // Default
        this.humidity = 60;
    }

    // Getters and setters for weather data
    public double getTemperature() { return temperature; }
    public void setTemperature(double temperature) { this.temperature = temperature; }
    public double getHumidity() { return humidity; }
    public void setHumidity(double humidity) { this.humidity = humidity; }

    /**
     * Weather-adjusted consumption (Polymorphism - overrides parent)
     * If temperature > 35°C or humidity > 80%, consumption is expected to be higher
     */
    @Override
    public double calculateActualConsumption() {
        double base = super.calculateActualConsumption();

        // Adjust for extreme weather - AC works harder
        if (temperature > 35 || humidity > 80) {
            return base * 1.15; // 15% increase in extreme conditions
        }
        return base;
    }

    /**
     * Context-aware analysis for AC
     * Returns explanation for high consumption
     */
    public String analyzeConsumption() {
        double deviation = calculateDeviation();

        if (temperature >= 35 || humidity >= 80) {
            return "Higher consumption may be explained by today's extreme weather "
                 + "(" + temperature + "°C, " + humidity + "% humidity). "
                 + "This may not indicate a fault.";
        }

        if (deviation > 20) {
            return "Unexpected AC energy consumption detected. "
                 + "Temperature is " + temperature + "°C with " + humidity + "% humidity. "
                 + "Possible AC efficiency problem detected.";
        }

        if (deviation > 10) {
            return "AC consumption is slightly above normal. Monitor for a few more days.";
        }

        return "AC is operating within normal range.";
    }

    @Override
    public String toString() {
        return super.toString() + " | Temp: " + temperature + "°C | Humidity: " + humidity + "%";
    }
}
