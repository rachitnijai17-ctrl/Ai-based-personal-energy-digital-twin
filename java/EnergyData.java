import java.util.ArrayList;
import java.util.HashMap;

/**
 * EnergyData.java - Stores and manages energy reading data
 * Uses: Collections (ArrayList, HashMap)
 */
public class EnergyData {
    private ArrayList<Double> dailyReadings;      // Daily kWh readings
    private ArrayList<Double> monthlyReadings;     // Monthly kWh readings
    private HashMap<String, Double> roomConsumption; // Room-wise consumption

    public EnergyData() {
        dailyReadings = new ArrayList<>();
        monthlyReadings = new ArrayList<>();
        roomConsumption = new HashMap<>();
    }

    // --- Daily Readings ---
    public void addDailyReading(double reading) {
        if (reading < 0) {
            throw new IllegalArgumentException("Energy reading cannot be negative: " + reading);
        }
        dailyReadings.add(reading);
    }

    public ArrayList<Double> getDailyReadings() {
        return dailyReadings;
    }

    public double getAverageDailyConsumption() {
        if (dailyReadings.isEmpty()) return 0;
        double sum = 0;
        for (int i = 0; i < dailyReadings.size(); i++) {
            sum += dailyReadings.get(i);
        }
        return sum / dailyReadings.size();
    }

    // --- Monthly Readings ---
    public void addMonthlyReading(double reading) {
        if (reading < 0) {
            throw new IllegalArgumentException("Energy reading cannot be negative");
        }
        monthlyReadings.add(reading);
    }

    public ArrayList<Double> getMonthlyReadings() {
        return monthlyReadings;
    }

    // --- Room Consumption ---
    public void setRoomConsumption(String room, double consumption) {
        roomConsumption.put(room, consumption);
    }

    public double getRoomConsumption(String room) {
        if (roomConsumption.containsKey(room)) {
            return roomConsumption.get(room);
        }
        return 0;
    }

    public HashMap<String, Double> getAllRoomConsumption() {
        return roomConsumption;
    }

    /**
     * Calculate room-wise consumption from appliance list
     */
    public void calculateRoomConsumption(ArrayList<Appliance> appliances) {
        roomConsumption.clear();
        for (int i = 0; i < appliances.size(); i++) {
            Appliance a = appliances.get(i);
            String room = a.getRoom();
            double consumption = a.calculateActualConsumption();
            if (roomConsumption.containsKey(room)) {
                roomConsumption.put(room, roomConsumption.get(room) + consumption);
            } else {
                roomConsumption.put(room, consumption);
            }
        }
    }
}
