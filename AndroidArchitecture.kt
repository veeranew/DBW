package com.vitaltrack.pro

import androidx.room.*
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import kotlinx.coroutines.flow.Flow
import javax.inject.Inject
import javax.inject.Singleton

// ============================================================================
// 1. ROOM DATABASE ENTITIES & SQL ORM SCHEMA
// ============================================================================

@Entity(tableName = "users")
data class UserEntity(
    @PrimaryKey val id: String,
    val name: String,
    val age: Int,
    val gender: String, // MALE, FEMALE, OTHER
    val heightCm: Float,
    val weightGoalKg: Float,
    val isPremium: Boolean = false,
    val createdAt: Long = System.currentTimeMillis()
)

@Entity(
    tableName = "blood_sugar_logs",
    indices = [Index(value = ["user_id", "timestamp"])]
)
data class BloodSugarLogEntity(
    @PrimaryKey val id: String,
    @ColumnInfo(name = "user_id") val userId: String,
    @ColumnInfo(name = "value_mg_dl") val valueMgDl: Float,
    @ColumnInfo(name = "context_type") val contextType: String, // FASTING, BEFORE_MEAL, AFTER_MEAL, BEDTIME
    val notes: String?,
    val timestamp: Long,
    @ColumnInfo(name = "is_synced") val isSynced: Boolean = false
)

@Entity(
    tableName = "blood_pressure_logs",
    indices = [Index(value = ["user_id", "timestamp"])]
)
data class BloodPressureLogEntity(
    @PrimaryKey val id: String,
    @ColumnInfo(name = "user_id") val userId: String,
    val systolic: Int,
    val diastolic: Int,
    val pulse: Int,
    val notes: String?,
    val timestamp: Long,
    @ColumnInfo(name = "is_synced") val isSynced: Boolean = false
)

@Entity(
    tableName = "weight_logs",
    indices = [Index(value = ["user_id", "timestamp"])]
)
data class WeightLogEntity(
    @PrimaryKey val id: String,
    @ColumnInfo(name = "user_id") val userId: String,
    @ColumnInfo(name = "weight_kg") val weightKg: Float,
    val bmi: Float,
    @ColumnInfo(name = "bmi_category") val bmiCategory: String, // UNDERWEIGHT, NORMAL, OVERWEIGHT, OBESE
    val notes: String?,
    val timestamp: Long,
    @ColumnInfo(name = "is_synced") val isSynced: Boolean = false
)

// ============================================================================
// 2. ROOM DAOS (DATA ACCESS OBJECTS)
// ============================================================================

@Dao
interface HealthDao {
    @Query("SELECT * FROM blood_sugar_logs WHERE user_id = :userId ORDER BY timestamp DESC")
    fun getBloodSugarLogs(userId: String): Flow<List<BloodSugarLogEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertBloodSugarLog(log: BloodSugarLogEntity)

    @Query("SELECT * FROM blood_pressure_logs WHERE user_id = :userId ORDER BY timestamp DESC")
    fun getBloodPressureLogs(userId: String): Flow<List<BloodPressureLogEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertBloodPressureLog(log: BloodPressureLogEntity)

    @Query("SELECT * FROM weight_logs WHERE user_id = :userId ORDER BY timestamp DESC")
    fun getWeightLogs(userId: String): Flow<List<WeightLogEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertWeightLog(log: WeightLogEntity)
}

// ============================================================================
// 3. ROOM DATABASE CONFIGURATION
// ============================================================================

@Database(
    entities = [
        UserEntity::class,
        BloodSugarLogEntity::class,
        BloodPressureLogEntity::class,
        WeightLogEntity::class
    ],
    version = 1,
    exportSchema = true
)
abstract class VitalTrackDatabase : RoomDatabase() {
    abstract fun healthDao(): HealthDao
}

// ============================================================================
// 4. DEPENDENCY INJECTION (HILT MODULE)
// ============================================================================

@Module
@InstallIn(SingletonComponent::class)
object AppModule {

    @Provides
    @Singleton
    fun provideDatabase(@dagger.hilt.android.qualifiers.ApplicationContext context: android.content.Context): VitalTrackDatabase {
        return Room.databaseBuilder(
            context,
            VitalTrackDatabase::class.java,
            "vitaltrack_db"
        ).fallbackToDestructiveMigration().build()
    }

    @Provides
    fun provideHealthDao(db: VitalTrackDatabase): HealthDao = db.healthDao()
}

// ============================================================================
// 5. DOMAIN ENGINE: BMI & HEALTH CALCULATOR
// ============================================================================

object HealthCalculatorEngine {
    fun calculateBmi(weightKg: Float, heightCm: Float): Pair<Float, String> {
        if (heightCm <= 0f) return Pair(0f, "NORMAL")
        val heightM = heightCm / 100f
        val bmi = (weightKg / (heightM * heightM))
        val roundedBmi = Math.round(bmi * 10f) / 10f

        val category = when {
            roundedBmi < 18.5f -> "UNDERWEIGHT"
            roundedBmi < 25.0f -> "NORMAL"
            roundedBmi < 30.0f -> "OVERWEIGHT"
            else -> "OBESE"
        }
        return Pair(roundedBmi, category)
    }

    fun getAHABloodPressureCategory(systolic: Int, diastolic: Int): String {
        return when {
            systolic > 180 || diastolic > 120 -> "HYPERTENSIVE_CRISIS"
            systolic >= 140 || diastolic >= 90 -> "HYPERTENSION_STAGE_2"
            systolic in 130..139 || diastolic in 80..89 -> "HYPERTENSION_STAGE_1"
            systolic in 120..129 && diastolic < 80 -> "ELEVATED"
            else -> "NORMAL"
        }
    }
}
