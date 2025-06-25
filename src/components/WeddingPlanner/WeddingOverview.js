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
import { toast } from 'react-hot-toast';

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

const WeddingOverview = ({ weddingData, onNavigate }) => {
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
    const confirmed = guests.filter(g => g.rsvp_status === 'attending').length;
    const pending = guests.filter(g => g.rsvp_status === 'pending').length;
    const declined = guests.filter(g => g.rsvp_status === 'declined').length;
    const not_sure = guests.filter(g => g.rsvp_status === 'not_sure').length;
    const total = guests.length || 0;
    return { confirmed, pending, declined, not_sure, total };
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

  const handleTaskToggle = async (taskId) => {
    try {
      // Find the task in timelineItems
      const task = timelineItems.find(item => item.id === taskId);
      if (!task) return;

      const newCompletedStatus = !task.completed;

      // Update in database
      const { error } = await supabase
        .from('wedding_timeline_items')
        .update({ completed: newCompletedStatus })
        .eq('id', taskId);

      if (error) throw error;

      // Update local state
      setTimelineItems(timelineItems.map(item => 
        item.id === taskId ? { ...item, completed: newCompletedStatus } : item
      ));

      toast.success(newCompletedStatus ? 'Task completed!' : 'Task marked as incomplete');
    } catch (error) {
      console.error('Error updating task completion:', error);
      toast.error('Failed to update task status');
    }
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
      {/* Quick Actions */}
      <div className={styles.quickActions}>
        <h3>Quick Actions</h3>
        <div className={styles.actionButtons}>
          <button 
            className={`${styles.actionBtn} ${styles.primary}`}
            onClick={() => onNavigate && onNavigate('vendors')}
          >
            <i className="fas fa-plus"></i>
            <span>Add Vendor</span>
          </button>
          <button 
            className={`${styles.actionBtn} ${styles.secondary}`}
            onClick={() => onNavigate && onNavigate('guests')}
          >
            <i className="fas fa-user-plus"></i>
            <span>Add Guest</span>
          </button>
          <button 
            className={`${styles.actionBtn} ${styles.secondary}`}
            onClick={() => onNavigate && onNavigate('details')}
          >
            <i className="fas fa-edit"></i>
            <span>Edit Details</span>
          </button>
          <button 
            className={`${styles.actionBtn} ${styles.secondary}`}
            onClick={() => onNavigate && onNavigate('timeline')}
          >
            <i className="fas fa-tasks"></i>
            <span>View Checklist</span>
          </button>
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
          
          <div style={{
            marginTop: '20px',
            paddingTop: '15px',
            borderTop: '1px solid #e5e7eb',
            textAlign: 'center'
          }}>
            <button 
              onClick={() => onNavigate && onNavigate('budget')}
              style={{
                background: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)',
                color: 'white',
                border: 'none',
                padding: window.innerWidth <= 768 ? '12px 16px' : '10px 20px',
                borderRadius: '8px',
                fontSize: window.innerWidth <= 768 ? '0.8rem' : '0.875rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 2px 8px rgba(236, 72, 153, 0.3)',
                width: window.innerWidth <= 768 ? '100%' : 'auto',
                minHeight: window.innerWidth <= 768 ? '44px' : 'auto'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 4px 12px rgba(236, 72, 153, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 2px 8px rgba(236, 72, 153, 0.3)';
              }}
            >
              <i className="fas fa-chart-line" style={{ marginRight: '8px' }}></i>
              Manage Budget
            </button>
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
          
          <div style={{
            marginTop: '20px',
            paddingTop: '15px',
            borderTop: '1px solid #e5e7eb',
            textAlign: 'center'
          }}>
            <button 
              onClick={() => onNavigate && onNavigate('vendors')}
              style={{
                background: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)',
                color: 'white',
                border: 'none',
                padding: window.innerWidth <= 768 ? '12px 16px' : '10px 20px',
                borderRadius: '8px',
                fontSize: window.innerWidth <= 768 ? '0.8rem' : '0.875rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 2px 8px rgba(236, 72, 153, 0.3)',
                width: window.innerWidth <= 768 ? '100%' : 'auto',
                minHeight: window.innerWidth <= 768 ? '44px' : 'auto'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 4px 12px rgba(236, 72, 153, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 2px 8px rgba(236, 72, 153, 0.3)';
              }}
            >
              <i className="fas fa-users" style={{ marginRight: '8px' }}></i>
              Manage Vendors
            </button>
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
          
          <div style={{
            marginTop: '20px',
            paddingTop: '15px',
            borderTop: '1px solid #e5e7eb',
            textAlign: 'center'
          }}>
            <button 
              onClick={() => onNavigate && onNavigate('guests')}
              style={{
                background: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)',
                color: 'white',
                border: 'none',
                padding: window.innerWidth <= 768 ? '12px 16px' : '10px 20px',
                borderRadius: '8px',
                fontSize: window.innerWidth <= 768 ? '0.8rem' : '0.875rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 2px 8px rgba(236, 72, 153, 0.3)',
                width: window.innerWidth <= 768 ? '100%' : 'auto',
                minHeight: window.innerWidth <= 768 ? '44px' : 'auto'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 4px 12px rgba(236, 72, 153, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 2px 8px rgba(236, 72, 153, 0.3)';
              }}
            >
              <i className="fas fa-user-friends" style={{ marginRight: '8px' }}></i>
              Manage Guests
            </button>
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
                {importantTasks.slice(0, 3).map((task, index) => {
                  const priority = getTaskPriority(task.due_date);
                  const cleanTitle = task.title ? task.title.replace(/[^\w\s\-.,!?]/g, '').trim() : 'Untitled Task';
                  const cleanDescription = task.description ? task.description.replace(/[^\w\s\-.,!?]/g, '').trim() : '';
                  
                  return (
                    <div key={task.id} className={`${styles.taskCard} ${styles[priority]}`} style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      padding: window.innerWidth <= 768 ? '10px' : '12px',
                      marginBottom: '8px',
                      borderRadius: '8px',
                      border: '1px solid #e5e7eb',
                      backgroundColor: priority === 'urgent' ? '#fef2f2' : priority === 'soon' ? '#fffbeb' : '#f0f9ff',
                      borderLeft: `4px solid ${
                        priority === 'urgent' ? '#ef4444' : 
                        priority === 'soon' ? '#f59e0b' : 
                        priority === 'upcoming' ? '#3b82f6' : '#10b981'
                      }`
                    }}>
                      <div style={{ marginRight: window.innerWidth <= 768 ? '8px' : '12px', marginTop: '2px' }}>
                        <input
                          type="checkbox"
                          checked={task.completed}
                          onChange={() => handleTaskToggle(task.id)}
                          style={{
                            width: window.innerWidth <= 768 ? '18px' : '16px',
                            height: window.innerWidth <= 768 ? '18px' : '16px',
                            accentColor: priority === 'urgent' ? '#ef4444' : '#3b82f6'
                          }}
                        />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontWeight: '600',
                          fontSize: window.innerWidth <= 768 ? '0.8rem' : '0.875rem',
                          color: '#1f2937',
                          marginBottom: '4px',
                          textDecoration: task.completed ? 'line-through' : 'none',
                          opacity: task.completed ? 0.6 : 1
                        }}>
                          {cleanTitle}
                        </div>
                        {cleanDescription && (
                          <div style={{
                            fontSize: window.innerWidth <= 768 ? '0.7rem' : '0.75rem',
                            color: '#6b7280',
                            marginBottom: '6px',
                            lineHeight: '1.3'
                          }}>
                            {cleanDescription.length > (window.innerWidth <= 768 ? 40 : 60) ? `${cleanDescription.substring(0, window.innerWidth <= 768 ? 40 : 60)}...` : cleanDescription}
                          </div>
                        )}
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: window.innerWidth <= 768 ? '8px' : '12px',
                          fontSize: window.innerWidth <= 768 ? '0.7rem' : '0.75rem',
                          marginBottom: '8px',
                          flexWrap: window.innerWidth <= 768 ? 'wrap' : 'nowrap'
                        }}>
                          <span style={{
                            color: priority === 'urgent' ? '#dc2626' : 
                                   priority === 'soon' ? '#d97706' : '#2563eb',
                            fontWeight: '500'
                          }}>
                            <i className="fas fa-calendar-day" style={{ marginRight: '4px' }}></i>
                            {formatTaskDate(task.due_date)}
                          </span>
                          {task.responsible && task.responsible.trim() && (
                            <span style={{ color: '#6b7280' }}>
                              <i className="fas fa-user" style={{ marginRight: '4px' }}></i>
                              {task.responsible.trim()}
                            </span>
                          )}
                        </div>
                        <button 
                          onClick={() => onNavigate && onNavigate('timeline')}
                          style={{
                            background: 'none',
                            border: '1px solid #d1d5db',
                            borderRadius: '4px',
                            padding: window.innerWidth <= 768 ? '6px 10px' : '4px 8px',
                            fontSize: window.innerWidth <= 768 ? '0.7rem' : '0.75rem',
                            color: '#6b7280',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            width: window.innerWidth <= 768 ? '100%' : 'auto',
                            marginTop: window.innerWidth <= 768 ? '4px' : '0'
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.backgroundColor = '#f3f4f6';
                            e.target.style.borderColor = '#9ca3af';
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.backgroundColor = 'transparent';
                            e.target.style.borderColor = '#d1d5db';
                          }}
                        >
                          View Details →
                        </button>
                      </div>
                    </div>
                  );
                })}
                {importantTasks.length > 3 && (
                  <div style={{
                    textAlign: 'center',
                    padding: '12px',
                    marginTop: '8px'
                  }}>
                    <button 
                      onClick={() => onNavigate && onNavigate('timeline')}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#3b82f6',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        cursor: 'pointer',
                        textDecoration: 'underline'
                      }}
                    >
                      View {importantTasks.length - 3} more tasks →
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className={styles.noTasks}>
                <i className="fas fa-check-circle"></i>
                <p>{timelineItems.length === 0 ? 'No preparation tasks yet' : 'No upcoming tasks'}</p>
                <span>{timelineItems.length === 0 ? 'Add preparation tasks to get started' : 'All preparation tasks are completed!'}</span>
              </div>
            )}
            <div className={styles.taskStats} style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginTop: '15px',
              padding: '10px 0',
              borderTop: '1px solid #e5e7eb',
              fontSize: window.innerWidth <= 768 ? '0.8rem' : '0.875rem',
              color: '#6b7280',
              flexDirection: window.innerWidth <= 768 ? 'column' : 'row',
              gap: window.innerWidth <= 768 ? '8px' : '0'
            }}>
              <div className={styles.taskStatItem}>
                <span className={styles.taskCount} style={{ fontWeight: '500' }}>
                  {timelineItems.filter(item => !item.completed).length} preparation tasks remaining
                </span>
              </div>
              <div className={styles.taskStatItem}>
                <span className={styles.taskCompleted} style={{ fontWeight: '500', color: '#10b981' }}>
                  {timelineItems.filter(item => item.completed).length} completed
                </span>
              </div>
            </div>
          </div>
          
          <div style={{
            marginTop: '20px',
            paddingTop: '15px',
            borderTop: '1px solid #e5e7eb',
            textAlign: 'center'
          }}>
            <button 
              onClick={() => onNavigate && onNavigate('timeline')}
              style={{
                background: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)',
                color: 'white',
                border: 'none',
                padding: window.innerWidth <= 768 ? '12px 16px' : '10px 20px',
                borderRadius: '8px',
                fontSize: window.innerWidth <= 768 ? '0.8rem' : '0.875rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 2px 8px rgba(236, 72, 153, 0.3)',
                width: window.innerWidth <= 768 ? '100%' : 'auto',
                minHeight: window.innerWidth <= 768 ? '44px' : 'auto'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 4px 12px rgba(236, 72, 153, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 2px 8px rgba(236, 72, 153, 0.3)';
              }}
            >
              <i className="fas fa-tasks" style={{ marginRight: '8px' }}></i>
              View Timeline
            </button>
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
          
          <div style={{
            marginTop: '20px',
            paddingTop: '15px',
            borderTop: '1px solid #e5e7eb',
            textAlign: 'center'
          }}>
            <button 
              onClick={() => onNavigate && onNavigate('details')}
              style={{
                background: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)',
                color: 'white',
                border: 'none',
                padding: window.innerWidth <= 768 ? '12px 16px' : '10px 20px',
                borderRadius: '8px',
                fontSize: window.innerWidth <= 768 ? '0.8rem' : '0.875rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 2px 8px rgba(236, 72, 153, 0.3)',
                width: window.innerWidth <= 768 ? '100%' : 'auto',
                minHeight: window.innerWidth <= 768 ? '44px' : 'auto'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 4px 12px rgba(236, 72, 153, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 2px 8px rgba(236, 72, 153, 0.3)';
              }}
            >
              <i className="fas fa-edit" style={{ marginRight: '8px' }}></i>
              Edit Details
            </button>
          </div>
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