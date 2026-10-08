import java.util.ArrayList;

/**
 * EnergyCalculator.java - Performs energy and cost calculations
 * Uses: Collections (ArrayList)
 */
public class EnergyCalculator {
    private double tariff;  // ₹ per kWh (configurable)

    // Constructor with default tariff
    public EnergyCalculator() {
        this.tariff = 8.0; // Default ₹8/kWh
    }

    // Constructor with custom tariff
    public EnergyCalculator(double tariff) {
        if (tariff < 0) {
            throw new IllegalArgumentException("Tariff cannot be negative");
        }
        this.tariff = tariff;
    }

    // Getter and setter
    public double getTariff() { return tariff; }
    public void setTariff(double tariff) {
        if (tariff < 0) throw new IllegalArgumentException("Tariff cannot be negative");
        this.tariff = tariff;
    }

    /**
     * Calculate energy from power and time
     * Energy (kWh) = Power (W) / 1000 × Hours
     */
    public static double calculateEnergy(double powerWatts, double hours) {
        if (powerWatts < 0 || hours < 0) return 0;
        return (powerWatts / 1000.0) * hours;
    }

    /**
     * Calculate cost from energy
     * Cost = Energy × Tariff
     */
    public double calculateCost(double energyKwh) {
        return energyKwh * tariff;
    }

    /**
     * Calculate total expected consumption for a list of appliances
     */
    public double calculateExpectedConsumption(ArrayList<Appliance> appliances) {
        double total = 0;
        for (int i = 0; i < appliances.size(); i++) {
            total += appliances.get(i).calculateExpectedConsumption();
        }
        return total;
    }

    /**
     * Calculate total actual consumption for a list of appliances
     */
    public double calculateActualConsumption(ArrayList<Appliance> appliances) {
        double total = 0;
        for (int i = 0; i < appliances.size(); i++) {
            total += appliances.get(i).calculateActualConsumption();
        }
        return total;
    }

    /**
     * Calculate deviation between expected and actual
     */
    public double calculateDeviation(ArrayList<Appliance> appliances) {
        double expected = calculateExpectedConsumption(appliances);
        double actual = calculateActualConsumption(appliances);
        if (expected == 0) return 0;
        return ((actual - expected) / expected) * 100;
    }

    /**
     * Calculate unaccounted consumption
     * Compares meter reading with sum of appliance consumption
     */
    public double calculateUnaccountedConsumption(double meterReading,
                                                   ArrayList<Appliance> appliances) {
        double applianceTotal = calculateActualConsumption(appliances);
        double unaccounted = meterReading - applianceTotal;
        return unaccounted > 0 ? unaccounted : 0;
    }
}
