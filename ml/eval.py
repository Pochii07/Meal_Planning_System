import numpy as np

import matplotlib.pyplot as plt

def plot_model_performance(model_names, accuracy_values, precision_values, recall_values, f1_values):
    """
    Create a bar graph comparing performance metrics of different ML models.
    
    Parameters:
    -----------
    model_names : list
        Names of the ML models
    accuracy_values : list
        Accuracy scores for each model
    precision_values : list
        Precision scores for each model
    recall_values : list
        Recall scores for each model
    f1_values : list
        F1 scores for each model
    """
    # Set width of bars
    bar_width = 0.2
    x = np.arange(len(model_names))
    
    # Create the plot
    fig, ax = plt.subplots(figsize=(12, 8))
    
    # Add bars for each metric
    bars1 = ax.bar(x - bar_width*1.5, accuracy_values, bar_width, label='Accuracy', color='royalblue')
    bars2 = ax.bar(x - bar_width/2, precision_values, bar_width, label='Precision', color='forestgreen')
    bars3 = ax.bar(x + bar_width/2, recall_values, bar_width, label='Recall', color='firebrick')
    bars4 = ax.bar(x + bar_width*1.5, f1_values, bar_width, label='F1 Score', color='goldenrod')
    
    # Add labels, title, and legend
    ax.set_xlabel('Models', fontsize=14)
    ax.set_ylabel('Scores', fontsize=14)
    ax.set_title('ML Model Performance Comparison', fontsize=16, fontweight='bold')
    ax.set_xticks(x)
    ax.set_xticklabels(model_names, rotation=45, ha='right', fontsize=16)
    ax.legend()
    
    # Add value labels above bars
    def add_labels(bars):
        for bar in bars:
            height = bar.get_height()
            ax.annotate(f'{height:.2f}',
                        xy=(bar.get_x() + bar.get_width() / 2, height),
                        xytext=(0, 3),  # 3 points vertical offset
                        textcoords="offset points",
                        ha='center', va='bottom')
    
    add_labels(bars1)
    add_labels(bars2)
    add_labels(bars3)
    add_labels(bars4)
    
    # Set y-axis limits to give some headroom for annotations
    ax.set_ylim(0, max(max(accuracy_values), max(precision_values), 
                       max(recall_values), max(f1_values)) * 1.15)
    
    plt.tight_layout()
    return fig, ax

if __name__ == "__main__":
    # Example usage
    models = [  "(CBF)(CF)(KNN)",
                "Random Forest Classification", 
                "K-Means Clustering", 
                "K-Means with Random Forest"]
    precision = [0.75, 0.88, 0.89, 0.86]
    recall =    [0.75, 0.84, 0.90, 0.99]
    f1 =        [0.75, 0.82, 0.89, 0.91]
    accuracy =  [0.75, 0.92, 0.90, 0.94]
    
    fig, ax = plot_model_performance(models, accuracy, precision, recall, f1)
    plt.savefig('model_performance.png', dpi=300)
    plt.show()