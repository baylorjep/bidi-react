import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  Title,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
} from 'chart.js';
import { Pie } from 'react-chartjs-2';
import styles from './WeddingOverview.module.css';

// Register Chart.js components
ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  Title,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler
);

const WeddingOverview = ({ weddingData }) => {
  const [budgetItems, setBudgetItems] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [guests, setGuests] = useState([]);
  const [timelineItems, setTimelineItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPlannedBudget, setShowPlannedBudget] = useState(false);

  // Default vendor categories (matching BudgetTracker)
  const defaultVendorCategories = [
    { id: 'photography', name: 'Photography', icon: 'fas fa-camera', color: '#667eea', isDefault: true },
    { id: 'videography', name: 'Videography', icon: 'fas fa-video', color: '#764ba2', isDefault: true },
    { id: 'catering', name: 'Catering', icon: 'fas fa-utensils', color: '#f093fb', isDefault: true },
    { id: 'dj', name: 'DJ & Music', icon: 'fas fa-music', color: '#4facfe', isDefault: true },
    { id: 'florist', name: 'Florist', icon: 'fas fa-seedling', color: '#43e97b', isDefault: true },
    { id: 'beauty', name: 'Hair & Makeup', icon: 'fas fa-spa', color: '#fa709a', isDefault: true },
    { id: 'venue', name: 'Venue', icon: 'fas fa-building', color: '#a8edea', isDefault: true },
    { id: 'transportation', name: 'Transportation', icon: 'fas fa-car', color: '#ffecd2', isDefault: true },
    { id: 'officiant', name: 'Officiant', icon: 'fas fa-pray', color: '#fc466b', isDefault: true },
    { id: 'decor', name: 'Decor & Rentals', icon: 'fas fa-palette', color: '#ff9a9e', isDefault: true },
    { id: 'planning', name: 'Wedding Planning', icon: 'fas fa-calendar-check', color: '#ff6b6b', isDefault: true }
  ];

  useEffect(() => {
    loadOverviewData();
  }, [weddingData.id]);

  const loadOverviewData = async () => {
    try {
      setLoading(true);
      
      // Load budget items
      const { data: budgetData, error: budgetError } = await supabase
        .from('wedding_budget_items')
        .select('*')
        .eq('wedding_id', weddingData.id)
        .order('created_at', { ascending: false });

      if (budgetError) throw budgetError;
      setBudgetItems(budgetData || []);

      // Load vendors
      const { data: vendorData, error: vendorError } = await supabase
        .from('wedding_vendors')
        .select('*')
        .eq('wedding_id', weddingData.id)
        .order('created_at', { ascending: false });

      if (vendorError) throw vendorError;
      setVendors(vendorData || []);

      // Load guests
      const { data: guestData, error: guestError } = await supabase
        .from('wedding_guests')
        .select('*')
        .eq('wedding_id', weddingData.id)
        .order('created_at', { ascending: false });

      if (guestError) throw guestError;
      setGuests(guestData || []);

      // Load timeline items
      const { data: timelineData, error: timelineError } = await supabase
        .from('wedding_timeline_items')
        .select('*')
        .eq('wedding_id', weddingData.id)
        .eq('category', 'preparation')
        .order('due_date', { ascending: true });

      if (timelineError) throw timelineError;
      setTimelineItems(timelineData || []);

      setLoading(false);
    } catch (error) {
      console.error('Error loading overview data:', error);
      setLoading(false);
    }
  };

  const calculateDaysUntilWedding = () => {
    const weddingDate = new Date(weddingData.wedding_date);
    const today = new Date();
    return Math.ceil((weddingDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  };

  const getWeddingPhase = (daysUntil) => {
    if (daysUntil < 0) return { phase: 'Wedding Memories', icon: '💕', color: '#8b5cf6' };
    if (daysUntil === 0) return { phase: 'Wedding Day!', icon: '🎉', color: '#f59e0b' };
    if (daysUntil <= 7) return { phase: 'Final Week', icon: '⏰', color: '#ef4444' };
    if (daysUntil <= 30) return { phase: 'Last Month', icon: '📅', color: '#f59e0b' };
    if (daysUntil <= 90) return { phase: 'Planning Phase', icon: '📋', color: '#3b82f6' };
    return { phase: 'Early Planning', icon: '🌱', color: '#10b981' };
  };

  const formatCurrency = (amount) => {
    if (!amount) return '$0';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const calculateBudgetProgress = () => {
    if (!weddingData.budget) return { spent: 0, remaining: 0, percentage: 0 };
    const spent = budgetItems.reduce((sum, item) => sum + (parseFloat(item.actual_cost) || 0), 0);
    const remaining = weddingData.budget - spent;
    const percentage = (spent / weddingData.budget) * 100;
    return { spent, remaining, percentage: Math.min(percentage, 100) };
  };

  const getVendorStatus = () => {
    const booked = vendors.filter(v => v.status === 'booked').length;
    const total = vendors.length || 0;
    return { booked, total, percentage: total > 0 ? (booked / total) * 100 : 0 };
  };

  const getGuestStats = () => {
    const confirmed = guests.filter(g => g.status === 'confirmed').length;
    const pending = guests.filter(g => g.status === 'pending').length;
    const declined = guests.filter(g => g.status === 'declined').length;
    const total = guests.length || 0;
    return { confirmed, pending, declined, total };
  };

  const getCategoryTotals = () => {
    const categoryTotals = {};
    
    defaultVendorCategories.forEach(category => {
      const categoryItems = budgetItems.filter(item => item.category === category.id);
      const spent = categoryItems.reduce((sum, item) => sum + (parseFloat(item.actual_cost) || 0), 0);
      const planned = categoryItems.reduce((sum, item) => sum + (parseFloat(item.planned_cost) || 0), 0);
      
      if (spent > 0 || planned > 0) {
        categoryTotals[category.id] = {
          category: category,
          spent: Math.round(spent),
          planned: Math.round(planned),
          difference: Math.round(planned - spent)
        };
      }
    });
    
    return categoryTotals;
  };

  const getImportantTasks = () => {
    const today = new Date();
    const weddingDate = new Date(weddingData.wedding_date);
    
    // Filter tasks that are upcoming (not completed and due date is in the future or today)
    const upcomingTasks = timelineItems.filter(item => {
      if (item.completed) return false;
      
      const dueDate = new Date(item.due_date);
      return dueDate >= today;
    });

    // Sort by due date (closest first)
    upcomingTasks.sort((a, b) => new Date(a.due_date) - new Date(b.due_date));

    // Return the next 5 most important tasks
    return upcomingTasks.slice(0, 5);
  };

  const formatTaskDate = (dueDate) => {
    const date = new Date(dueDate);
    const today = new Date();
    const diffTime = date.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays < 0) return 'Overdue';
    if (diffDays <= 7) return `${diffDays} days`;
    if (diffDays <= 30) return `${Math.ceil(diffDays / 7)} weeks`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getTaskPriority = (dueDate) => {
    const date = new Date(dueDate);
    const today = new Date();
    const diffTime = date.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'overdue';
    if (diffDays <= 3) return 'urgent';
    if (diffDays <= 7) return 'soon';
    if (diffDays <= 30) return 'upcoming';
    return 'future';
  };

  const daysUntil = calculateDaysUntilWedding();
  const weddingPhase = getWeddingPhase(daysUntil);
  const budgetProgress = calculateBudgetProgress();
  const vendorStatus = getVendorStatus();
  const guestStats = getGuestStats();
  const categoryTotals = getCategoryTotals();
  const importantTasks = getImportantTasks();

  if (loading) {
    return (
      <div className={styles.weddingOverviewLoading}>
        <div className={styles.loadingSpinner}></div>
        <p>Loading your wedding overview...</p>
      </div>
    );
  }

  return (
    <div className={styles.weddingOverview}>
      {/* Hero Section */}
      <div className={styles.overviewHero}>
        <div className={styles.heroContent}>
          <div className={styles.weddingTitleSection}>
            <h1 className={styles.weddingTitle}>{weddingData.wedding_title}</h1>
            <div className={styles.weddingDateDisplay}>
              <i className="fas fa-calendar-heart"></i>
              <span>{new Date(weddingData.wedding_date).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}</span>
            </div>
            <div className={styles.weddingLocation}>
              <i className="fas fa-map-marker-alt"></i>
              <span>{weddingData.wedding_location || 'Location TBD'}</span>
            </div>
          </div>
          
          <div className={styles.countdownSection}>
            <div className={`${styles.countdownCard} ${styles[weddingPhase.phase.toLowerCase().replace(/\s+/g, '')]}`}>
              <div className={styles.countdownIcon}>{weddingPhase.icon}</div>
              <div className={styles.countdownContent}>
                <h3>{weddingPhase.phase}</h3>
                <p className={styles.countdownDays}>
                  {daysUntil < 0 ? 'Wedding has passed' : 
                   daysUntil === 0 ? 'Today is your wedding day!' :
                   `${daysUntil} ${daysUntil === 1 ? 'day' : 'days'} to go`}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className={styles.metricsGrid}>
        <div className={`${styles.metricCard} ${styles.budgetMetric} ${styles.comprehensiveBudget}`}>
          <div className={styles.metricHeader}>
            <i className="fas fa-dollar-sign"></i>
            <h3>Budget Overview</h3>
            <div className={styles.budgetToggle}>
              <button 
                className={`${styles.toggleBtn} ${!showPlannedBudget ? styles.active : ''}`}
                onClick={() => setShowPlannedBudget(false)}
              >
                <i className="fas fa-dollar-sign"></i>
                Actual
              </button>
              <button 
                className={`${styles.toggleBtn} ${showPlannedBudget ? styles.active : ''}`}
                onClick={() => setShowPlannedBudget(true)}
              >
                <i className="fas fa-calendar-alt"></i>
                Planned
              </button>
            </div>
          </div>
          
          <div className={styles.budgetContent}>
            <div className={styles.budgetOverviewSection}>
              <div className={styles.budgetAmounts}>
                <div className={styles.budgetItem}>
                  <span className={styles.budgetLabel}>Total Budget</span>
                  <span className={styles.budgetValue}>{formatCurrency(weddingData.budget)}</span>
                </div>
                <div className={styles.budgetItem}>
                  <span className={styles.budgetLabel}>Spent</span>
                  <span className={`${styles.budgetValue} ${styles.spent}`}>{formatCurrency(budgetProgress.spent)}</span>
                </div>
                <div className={styles.budgetItem}>
                  <span className={styles.budgetLabel}>Remaining</span>
                  <span className={`${styles.budgetValue} ${styles.remaining}`}>{formatCurrency(budgetProgress.remaining)}</span>
                </div>
              </div>
              <div className={styles.budgetProgress}>
                <div className={styles.progressBar}>
                  <div 
                    className={styles.progressFill} 
                    style={{ width: `${budgetProgress.percentage}%` }}
                  ></div>
                </div>
                <span className={styles.progressText}>{budgetProgress.percentage.toFixed(1)}% used</span>
              </div>
            </div>

            <div className={styles.budgetChartSection}>
              <BudgetPieChart 
                budgetItems={budgetItems} 
                budgetCategories={defaultVendorCategories}
                showPlanned={showPlannedBudget}
              />
            </div>

            <div className={styles.categoryBreakdown}>
              <h4>Category Breakdown</h4>
              <div className={styles.categoryList}>
                {Object.entries(categoryTotals).map(([categoryId, data]) => {
                  const category = defaultVendorCategories.find(c => c.id === categoryId);
                  const itemCount = budgetItems.filter(item => item.category === categoryId).length;
                  
                  return (
                    <div key={categoryId} className={styles.categoryItem}>
                      <div className={styles.categoryInfo}>
                        <div className={styles.categoryIcon} style={{ backgroundColor: category.color }}>
                          <i className={category.icon}></i>
                        </div>
                        <div className={styles.categoryDetails}>
                          <span className={styles.categoryName}>{category.name}</span>
                          <span className={styles.categoryCount}>{itemCount} items</span>
                        </div>
                      </div>
                      <div className={styles.categoryAmounts}>
                        <span className={`${styles.amount} ${styles.spent}`}>${data.spent.toLocaleString()}</span>
                        {showPlannedBudget && (
                          <span className={`${styles.amount} ${styles.planned}`}>${data.planned.toLocaleString()}</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div className={`${styles.metricCard} ${styles.vendorMetric}`}>
          <div className={styles.metricHeader}>
            <i className="fas fa-users"></i>
            <h3>Vendors</h3>
          </div>
          <div className={styles.metricContent}>
            <div className={styles.vendorStats}>
              <div className={styles.statItem}>
                <span className={styles.statNumber}>{vendorStatus.booked}</span>
                <span className={styles.statLabel}>Booked</span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statNumber}>{vendorStatus.total - vendorStatus.booked}</span>
                <span className={styles.statLabel}>Pending</span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statNumber}>{vendorStatus.total}</span>
                <span className={styles.statLabel}>Total</span>
              </div>
            </div>
            <div className={styles.vendorProgress}>
              <div className={styles.progressBar}>
                <div 
                  className={styles.progressFill} 
                  style={{ width: `${vendorStatus.percentage}%` }}
                ></div>
              </div>
              <span className={styles.progressText}>{vendorStatus.percentage.toFixed(1)}% complete</span>
            </div>
          </div>
        </div>

        <div className={`${styles.metricCard} ${styles.guestMetric}`}>
          <div className={styles.metricHeader}>
            <i className="fas fa-user-friends"></i>
            <h3>Guests</h3>
          </div>
          <div className={styles.metricContent}>
            <div className={styles.guestStats}>
              <div className={`${styles.statItem} ${styles.confirmed}`}>
                <span className={styles.statNumber}>{guestStats.confirmed}</span>
                <span className={styles.statLabel}>Confirmed</span>
              </div>
              <div className={`${styles.statItem} ${styles.pending}`}>
                <span className={styles.statNumber}>{guestStats.pending}</span>
                <span className={styles.statLabel}>Pending</span>
              </div>
              <div className={`${styles.statItem} ${styles.declined}`}>
                <span className={styles.statNumber}>{guestStats.declined}</span>
                <span className={styles.statLabel}>Declined</span>
              </div>
            </div>
            <div className={styles.guestTotal}>
              <span className={styles.totalLabel}>Total Guests</span>
              <span className={styles.totalNumber}>{guestStats.total}</span>
            </div>
          </div>
        </div>

        <div className={`${styles.metricCard} ${styles.timelineMetric}`}>
          <div className={styles.metricHeader}>
            <i className="fas fa-tasks"></i>
            <h3>Important Tasks</h3>
          </div>
          <div className={styles.metricContent}>
            {importantTasks.length > 0 ? (
              <div className={styles.taskList}>
                {importantTasks.map((task, index) => {
                  const priority = getTaskPriority(task.due_date);
                  return (
                    <div key={task.id} className={`${styles.taskItem} ${styles[priority]}`}>
                      <div className={styles.taskContent}>
                        <div className={styles.taskTitle}>{task.title}</div>
                        {task.description && (
                          <div className={styles.taskDescription}>{task.description}</div>
                        )}
                      </div>
                      <div className={styles.taskMeta}>
                        <span className={`${styles.taskDate} ${styles[priority]}`}>
                          {formatTaskDate(task.due_date)}
                        </span>
                        {task.responsible && (
                          <span className={styles.taskResponsible}>
                            <i className="fas fa-user"></i>
                            {task.responsible}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className={styles.noTasks}>
                <i className="fas fa-check-circle"></i>
                <p>No upcoming tasks</p>
                <span>All preparation tasks are completed!</span>
              </div>
            )}
            <div className={styles.taskStats}>
              <span className={styles.taskCount}>
                {timelineItems.filter(item => !item.completed).length} tasks remaining
              </span>
              <span className={styles.taskCompleted}>
                {timelineItems.filter(item => item.completed).length} completed
              </span>
            </div>
          </div>
        </div>

        <div className={`${styles.metricCard} ${styles.detailsMetric}`}>
          <div className={styles.metricHeader}>
            <i className="fas fa-info-circle"></i>
            <h3>Wedding Details</h3>
          </div>
          <div className={styles.metricContent}>
            <div className={styles.detailItems}>
              <div className={styles.detailItem}>
                <i className="fas fa-palette"></i>
                <div className={styles.detailContent}>
                  <span className={styles.detailLabel}>Style</span>
                  <span className={styles.detailValue}>{weddingData.wedding_style || 'Not set'}</span>
                </div>
              </div>
              <div className={styles.detailItem}>
                <i className="fas fa-paint-brush"></i>
                <div className={styles.detailContent}>
                  <span className={styles.detailLabel}>Colors</span>
                  <span className={styles.detailValue}>{weddingData.color_scheme || 'Not set'}</span>
                </div>
              </div>
              <div className={styles.detailItem}>
                <i className="fas fa-users"></i>
                <div className={styles.detailContent}>
                  <span className={styles.detailLabel}>Expected Guests</span>
                  <span className={styles.detailValue}>{weddingData.guest_count || 'Not set'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className={styles.quickActions}>
        <h3>Quick Actions</h3>
        <div className={styles.actionButtons}>
          <button className={`${styles.actionBtn} ${styles.primary}`}>
            <i className="fas fa-plus"></i>
            <span>Add Vendor</span>
          </button>
          <button className={`${styles.actionBtn} ${styles.secondary}`}>
            <i className="fas fa-user-plus"></i>
            <span>Add Guest</span>
          </button>
          <button className={`${styles.actionBtn} ${styles.secondary}`}>
            <i className="fas fa-edit"></i>
            <span>Edit Details</span>
          </button>
          <button className={`${styles.actionBtn} ${styles.secondary}`}>
            <i className="fas fa-tasks"></i>
            <span>View Checklist</span>
          </button>
        </div>
      </div>
    </div>
  );
};

// Budget Pie Chart Component (adapted from BudgetTracker)
function BudgetPieChart({ budgetItems, budgetCategories, showPlanned }) {
  const getCategoryTotals = () => {
    const categoryTotals = {};
    budgetCategories.forEach(category => {
      const items = budgetItems.filter(item => item.category === category.id);
      const spent = Math.round(items.reduce((sum, item) => sum + (parseFloat(item.actual_cost) || 0), 0));
      const planned = Math.round(items.reduce((sum, item) => sum + (parseFloat(item.planned_cost) || 0), 0));
      categoryTotals[category.id] = { spent, planned, category };
    });
    return categoryTotals;
  };

  const categoryTotals = getCategoryTotals();
  const categoriesWithData = Object.entries(categoryTotals)
    .filter(([_, data]) => showPlanned ? data.planned > 0 : data.spent > 0)
    .sort(([_, a], [__, b]) => {
      const aTotal = showPlanned ? a.planned : a.spent;
      const bTotal = showPlanned ? b.planned : b.spent;
      return bTotal - aTotal;
    });

  // Check if there are any data
  const hasActualExpenses = budgetItems.some(item => parseFloat(item.actual_cost) > 0);
  const hasPlannedBudget = budgetItems.some(item => parseFloat(item.planned_cost) > 0);

  if (showPlanned && !hasPlannedBudget) {
    return (
      <div className={styles.noDataMessage}>
        <i className="fas fa-calendar-alt"></i>
        <p>No planned budget set yet</p>
        <span>Use the Budget Planner to set your planned spending</span>
      </div>
    );
  }

  if (!showPlanned && !hasActualExpenses) {
    return (
      <div className={styles.noDataMessage}>
        <i className="fas fa-plus-circle"></i>
        <p>No expenses tracked yet</p>
        <span>Start tracking your wedding expenses to see your spending breakdown</span>
      </div>
    );
  }

  if (categoriesWithData.length === 0) {
    return (
      <div className={styles.noDataMessage}>
        <i className="fas fa-chart-pie"></i>
        <p>No budget data available yet</p>
        <span>Add some expenses to see your spending breakdown</span>
      </div>
    );
  }

  const chartData = {
    labels: categoriesWithData.map(([_, data]) => data.category.name),
    datasets: [
      {
        label: showPlanned ? 'Planned' : 'Actual',
        data: categoriesWithData.map(([_, data]) => showPlanned ? data.planned : data.spent),
        backgroundColor: categoriesWithData.map(([_, data]) => {
          const baseColor = data.category.color;
          return showPlanned ? `${baseColor}80` : baseColor; // Planned gets transparency
        }),
        borderColor: categoriesWithData.map(([_, data]) => data.category.color),
        borderWidth: 2,
        hoverBorderWidth: 4,
        hoverOffset: 8,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 2500,
      easing: 'easeOutQuart',
      animateRotate: true,
      animateScale: true,
      delay: (context) => context.dataIndex * 100
    },
    plugins: {
      legend: {
        display: window.innerWidth >= 768,
        position: 'bottom',
        labels: {
          padding: 32,
          usePointStyle: true,
          pointStyle: 'circle',
          font: {
            size: 14,
            weight: '600',
            family: 'Inter, system-ui, sans-serif'
          },
          generateLabels: (chart) => {
            const data = chart.data;
            if (data.labels.length && data.datasets.length) {
              return data.labels.map((label, i) => {
                const dataset = data.datasets[0];
                const value = dataset.data[i];
                const total = dataset.data.reduce((a, b) => a + b, 0);
                const percentage = ((value / total) * 100).toFixed(1);
                const amount = value.toLocaleString();
                
                return {
                  text: `${label}: $${amount} (${percentage}%)`,
                  fillStyle: dataset.backgroundColor[i],
                  strokeStyle: dataset.backgroundColor[i],
                  lineWidth: 0,
                  pointStyle: 'circle',
                  hidden: false,
                  index: i
                };
              });
            }
            return [];
          }
        }
      },
      tooltip: {
        enabled: true,
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: 'rgba(255, 255, 255, 0.2)',
        borderWidth: 1,
        cornerRadius: 16,
        displayColors: true,
        padding: 20,
        titleFont: {
          size: 16,
          weight: '700',
          family: 'Inter, system-ui, sans-serif'
        },
        bodyFont: {
          size: 14,
          weight: '500',
          family: 'Inter, system-ui, sans-serif'
        },
        callbacks: {
          title: (context) => {
            return `${context[0].label}`;
          },
          label: (context) => {
            const label = context.label || '';
            const value = context.parsed;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return [
              `Amount: $${Math.round(value).toLocaleString()}`,
              `Percentage: ${percentage}%`,
              `Total: $${Math.round(total).toLocaleString()}`
            ];
          }
        }
      }
    },
    elements: {
      arc: {
        borderWidth: 4,
        borderColor: '#ffffff',
        hoverBorderWidth: 6,
        hoverBorderColor: '#ffffff',
        hoverOffset: 12
      }
    },
    layout: {
      padding: {
        top: 20,
        bottom: window.innerWidth >= 768 ? 20 : 10
      }
    }
  };

  const totalPlanned = categoriesWithData.reduce((sum, [_, data]) => sum + data.planned, 0);
  const totalActual = categoriesWithData.reduce((sum, [_, data]) => sum + data.spent, 0);
  const totalDifference = totalActual - totalPlanned;

  return (
    <div className={styles.pieChartWrapper}>
      <Pie data={chartData} options={chartOptions} />
      
      <div className={styles.chartSummary}>
        <div className={styles.summaryItem}>
          <span className={styles.label}>Total Planned:</span>
          <span className={`${styles.amount} ${styles.planned}`}>${Math.round(totalPlanned).toLocaleString()}</span>
        </div>
        <div className={styles.summaryItem}>
          <span className={styles.label}>Total Actual:</span>
          <span className={`${styles.amount} ${styles.actual}`}>${Math.round(totalActual).toLocaleString()}</span>
        </div>
        <div className={styles.summaryItem}>
          <span className={styles.label}>Difference:</span>
          <span className={`${styles.amount} ${styles.difference} ${totalDifference >= 0 ? styles.over : styles.under}`}>
            ${Math.round(Math.abs(totalDifference)).toLocaleString()} {totalDifference >= 0 ? 'Over' : 'Under'}
          </span>
        </div>
        <div className={styles.summaryItem}>
          <span className={styles.label}>Items:</span>
          <span className={styles.count}>{budgetItems.length}</span>
        </div>
      </div>
    </div>
  );
}

export default WeddingOverview; 