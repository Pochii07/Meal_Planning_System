import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";

// Generate PDF report for a patient's meal plan
export const generatePatientMealPlanReport = (patient) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Add header section
  doc.setFontSize(20);
  doc.setTextColor(39, 174, 96);
  doc.text("Patient Meal Plan Report", pageWidth / 2, 15, { align: "center" });

  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(
    `Generated on: ${format(new Date(), "MMMM dd, yyyy")}`,
    pageWidth / 2,
    22,
    { align: "center" }
  );

  // Patient information section
  doc.setFontSize(16);
  doc.setTextColor(0, 0, 0);
  doc.text(`Patient: ${patient.firstName} ${patient.lastName}`, 14, 35);

  const patientDetails = [
    ["Age", `${patient.age} years`],
    ["Height", `${patient.height} cm`],
    ["Weight", `${patient.weight} kg`],
    ["BMI", patient.BMI],
    ["TDEE", `${patient.TDEE} calories`],
    ["Dietary Preference", patient.preference || "None"],
    ["Restrictions", patient.restrictions || "None"],
    ["Activity Level", getActivityLevelLabel(patient.activity_level)],
  ];

  const firstTableEndY = autoTable(doc, {
    startY: 40,
    head: [["Attribute", "Value"]],
    body: patientDetails,
    theme: "grid",
    headStyles: { fillColor: [39, 174, 96] },
    margin: { left: 14, right: 14 },
    styles: { overflow: "linebreak" },
  });

  let finalY = (doc.lastAutoTable?.finalY ?? 70) + 15;

  // Meal plan section
  doc.setFontSize(16);
  doc.text("Weekly Meal Plan", 14, finalY);
  finalY += 10;

  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const meals = ["breakfast", "lunch", "dinner"];

  days.forEach((day, index) => {
    if (finalY > 250) {
      doc.addPage();
      finalY = 20;
    }

    // Day header
    doc.setFontSize(14);
    doc.setTextColor(39, 174, 96);
    doc.text(day, 14, finalY);

    if (patient.prediction?.[day]?.date) {
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(
        format(new Date(patient.prediction[day].date), 
        "MMM dd, yyyy"
        ),
        60,
        finalY
      );
    }

    finalY += 5;

    // Meal data preparation
    const mealData = meals.map((meal) => {
      const mealName = patient.prediction?.[day]?.[meal] || "Not assigned";
      const calories = patient.prediction?.[day]?.[`${meal}_details`]?.total_calories || "N/A";
      const servings = patient.prediction?.[day]?.[`${meal}_details`]?.servings || "N/A";
      const status = patient.skippedMeals?.[day]?.[meal] 
        ? "Skipped" 
        : patient.progress?.[day]?.[meal] 
          ? "Completed" 
          : "Pending";
      const notes = patient.nutritionistNotes?.[day]?.[meal] || "";

      return [
        meal.charAt(0).toUpperCase() + meal.slice(1),
        mealName,
        `${calories} kcal`,
        servings,
        status,
        notes,
      ];
    });

    // Meal table
    autoTable(doc, {
      startY: finalY,
      head: [["Meal", "Recipe", "Calories", "Servings", "Status", "Notes"]],
      body: mealData,
      theme: "striped",
      headStyles: { 
        fillColor: [220, 220, 220], 
        textColor: [0, 0, 0] 
      },
      margin: { left: 14, right: 14 },
      styles: { 
        overflow: "linebreak", 
        cellPadding: 2 
      },
    });

    finalY = (doc.lastAutoTable?.finalY ?? finalY + 30) + 15;
  });

  // Progress summary
  if (patient.progress) {
    const progress = calculateProgress(patient.progress, patient.skippedMeals);
    
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text("Progress Summary", 14, finalY);
    finalY += 10;
    
    doc.setFontSize(12);
    doc.text(
      `Completion Rate: ${progress.percent}% (${progress.completed}/${progress.total} meals)`,
      14,
      finalY
    );
  }

  // Save document
  doc.save(`${patient.lastName}_${patient.firstName}_meal_plan.pdf`);
};

// Helper functions
const calculateProgress = (progress, skippedMeals) => {
  if (!progress) return { percent: 0, completed: 0, total: 0 };

  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const meals = ["breakfast", "lunch", "dinner"];
  let completed = 0;
  const total = 21; // 7 days × 3 meals

  days.forEach((day) => {
    meals.forEach((meal) => {
      if (progress[day]?.[meal] && !skippedMeals?.[day]?.[meal]) {
        completed++;
      }
    });
  });

  return {
    percent: Math.round((completed / total) * 100),
    completed,
    total,
  };
};

const getActivityLevelLabel = (value) => {
  const activityValue = String(value);
  switch (activityValue) {
    case "1.2": return "Sedentary";
    case "1.4": return "Lightly Active";
    case "1.5": return "Moderately Active";
    case "1.7": return "Very Active";
    case "1.9": return "Extra Active";
    default: return value;
  }
};