import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../supabaseClient';
import { toast } from 'react-toastify';
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
import './BudgetTracker.css';

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

function BudgetTracker({ weddingData, onUpdate, compact = false }) {
  const [budgetItems, setBudgetItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddItem, setShowAddItem] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [activeTab, setActiveTab] = useState('tracker'); // 'tracker' or 'planner'
  const [customCategories, setCustomCategories] = useState([]);
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [totalBudget, setTotalBudget] = useState(parseFloat(weddingData.budget) || 0);
  const [itemFilter, setItemFilter] = useState('all'); // 'all', 'planned', 'actual'
  const [focusAreas, setFocusAreas] = useState([]);
  const [plannedBudget, setPlannedBudget] = useState({});
  const [excludedCategories, setExcludedCategories] = useState([]);
  const [categoryRanking, setCategoryRanking] = useState([]);
  const [hasCalculatedBudget, setHasCalculatedBudget] = useState(false);

  // Default budget recommendations based on industry averages (updated for vendor categories)
  const defaultRecommendations = {
    venue: { percentage: 35, description: "Venue typically takes the largest portion of your budget" },
    catering: { percentage: 25, description: "Food and beverage costs for your guests" },
    photography: { percentage: 12, description: "Professional photography preserves your memories" },
    videography: { percentage: 8, description: "Video captures your special moments" },
    dj: { percentage: 5, description: "Music and entertainment for your reception" },
    florist: { percentage: 8, description: "Beautiful flowers and decorations" },
    beauty: { percentage: 3, description: "Hair and makeup for the wedding party" },
    venue: { percentage: 35, description: "Venue typically takes the largest portion of your budget" },
    transportation: { percentage: 3, description: "Transportation for wedding party and guests" },
    officiant: { percentage: 1, description: "Wedding officiant services" },
    decor: { percentage: 8, description: "Decorations and rentals" },
    planning: { percentage: 10, description: "Professional wedding planning services" }
  };

  // Default vendor categories (matching VendorManager)
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

  // Combine default and custom categories, filtering out hidden ones
  const budgetCategories = useMemo(() => [
    ...defaultVendorCategories.filter(cat => !customCategories.find(hidden => 
      (hidden.category_id === cat.id || hidden.id === cat.id) && hidden.is_hidden
    )),
    ...customCategories.filter(cat => cat.is_custom && !cat.is_hidden).map(cat => ({
      id: cat.category_id,
      name: cat.category_name,
      icon: cat.category_icon,
      color: cat.category_color,
      isDefault: false
    }))
  ], [customCategories]);

  // Load budget items and categories on component mount
  useEffect(() => {
    loadBudgetItems();
    loadCustomCategories();
  }, [weddingData.id]);

  // Update document title when component mounts
  useEffect(() => {
    const title = `${String(weddingData.wedding_title || 'My Wedding')} - Budget Tracker - Bidi`;
    document.title = title;
  }, [weddingData.wedding_title]);

  const loadCustomCategories = async () => {
    try {
      // Load category preferences from Supabase (same as VendorManager)
      const { data: preferences, error } = await supabase
        .from('wedding_vendor_category_preferences')
        .select('*')
        .eq('wedding_id', weddingData.id);

      if (error) {
        console.error('Error loading category preferences:', error);
        setCustomCategories([]);
        return;
      }

      setCustomCategories(preferences || []);
    } catch (error) {
      console.error('Error loading custom categories:', error);
      setCustomCategories([]);
    }
  };

  const addCustomCategory = async (categoryData) => {
    try {
      const newCategory = {
        wedding_id: weddingData.id,
        category_id: `custom-${Date.now()}`,
        category_name: categoryData.name,
        category_icon: categoryData.icon,
        category_color: categoryData.color,
        is_hidden: false,
        is_custom: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('wedding_vendor_category_preferences')
        .insert([newCategory])
        .select()
        .single();

      if (error) throw error;

      setCustomCategories([...customCategories, data]);
      setShowCategoryManager(false);
      toast.success('Category added successfully!');
    } catch (error) {
      console.error('Error adding custom category:', error);
      toast.error('Failed to add category');
    }
  };

  const removeCustomCategory = async (categoryId) => {
    try {
      // Check if there are any budget items in this category
      const { data: budgetItemsInCategory, error: budgetError } = await supabase
        .from('wedding_budget_items')
        .select('id')
        .eq('wedding_id', weddingData.id)
        .eq('category', categoryId);

      if (budgetError) throw budgetError;

      if (budgetItemsInCategory && budgetItemsInCategory.length > 0) {
        toast.error('Cannot remove category that has budget items. Please remove or reassign budget items first.');
        return;
      }

      // Find the category to determine if it's default or custom
      const categoryToRemove = budgetCategories.find(cat => cat.id === categoryId);
      
      if (categoryToRemove && categoryToRemove.isDefault) {
        // For default categories, mark as hidden in Supabase
        const { error } = await supabase
          .from('wedding_vendor_category_preferences')
          .upsert([{
            wedding_id: weddingData.id,
            category_id: categoryId,
            category_name: categoryToRemove.name,
            category_icon: categoryToRemove.icon,
            category_color: categoryToRemove.color,
            is_hidden: true,
            is_custom: false,
            updated_at: new Date().toISOString()
          }], { onConflict: 'wedding_id,category_id' });

        if (error) throw error;

        // Add to local state
        const hiddenCategory = { 
          ...categoryToRemove, 
          isHidden: true,
          wedding_id: weddingData.id,
          category_id: categoryId,
          is_hidden: true,
          is_custom: false
        };
        setCustomCategories([...customCategories, hiddenCategory]);
        toast.success('Category hidden successfully!');
      } else {
        // For custom categories, delete from Supabase
        const { error } = await supabase
          .from('wedding_vendor_category_preferences')
          .delete()
          .eq('wedding_id', weddingData.id)
          .eq('category_id', categoryId)
          .eq('is_custom', true);

        if (error) throw error;

        // Remove from local state
        setCustomCategories(customCategories.filter(cat => cat.category_id !== categoryId));
        toast.success('Category removed successfully!');
      }
    } catch (error) {
      console.error('Error removing category:', error);
      toast.error('Failed to remove category');
    }
  };

  const unhideCategory = async (categoryId) => {
    try {
      // Remove the hidden preference from Supabase
      const { error } = await supabase
        .from('wedding_vendor_category_preferences')
        .delete()
        .eq('wedding_id', weddingData.id)
        .eq('category_id', categoryId)
        .eq('is_hidden', true);

      if (error) throw error;

      // Remove from local state
      setCustomCategories(customCategories.filter(cat => 
        !(cat.category_id === categoryId && cat.is_hidden)
      ));
      toast.success('Category unhidden successfully!');
    } catch (error) {
      console.error('Error unhiding category:', error);
      toast.error('Failed to unhide category');
    }
  };

  const loadBudgetItems = async () => {
    try {
      const { data, error } = await supabase
        .from('wedding_budget_items')
        .select('*')
        .eq('wedding_id', weddingData.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBudgetItems(data || []);
      setLoading(false);
    } catch (error) {
      console.error('Error loading budget items:', error);
      setLoading(false);
    }
  };

  const addBudgetItem = async (itemData) => {
    try {
      // Use the type that the user explicitly selected in the form
      const itemType = itemData.type || 'actual'; // Default to actual if no type specified

      const newItem = {
        wedding_id: weddingData.id,
        name: itemData.name,
        category: itemData.category,
        planned_cost: itemData.planned_cost || 0,
        actual_cost: itemData.actual_cost || 0,
        type: itemType,
        notes: itemData.notes || '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('wedding_budget_items')
        .insert([newItem])
        .select()
        .single();

      if (error) throw error;

      setBudgetItems([...budgetItems, data]);
      setShowAddItem(false);
      toast.success('Budget item added successfully!');
    } catch (error) {
      console.error('Error adding budget item:', error);
      toast.error('Failed to add budget item');
    }
  };

  const updateBudgetItem = async (itemId, updates) => {
    try {
      const { error } = await supabase
        .from('wedding_budget_items')
        .update(updates)
        .eq('id', itemId);

      if (error) throw error;

      setBudgetItems(budgetItems.map(item => 
        item.id === itemId ? { ...item, ...updates } : item
      ));
      toast.success('Budget item updated!');
    } catch (error) {
      console.error('Error updating budget item:', error);
      toast.error('Failed to update budget item');
    }
  };

  const deleteBudgetItem = async (itemId) => {
    try {
      const { error } = await supabase
        .from('wedding_budget_items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;

      setBudgetItems(budgetItems.filter(item => item.id !== itemId));
      toast.success('Budget item removed successfully!');
    } catch (error) {
      console.error('Error deleting budget item:', error);
      toast.error('Failed to remove budget item');
    }
  };

  const getFilteredItems = () => {
    let filtered = budgetItems;
    
    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(item => item.category === selectedCategory);
    }
    
    // Filter by item type
    if (itemFilter === 'planned') {
      filtered = filtered.filter(item => item.type === 'planned');
    } else if (itemFilter === 'actual') {
      // Include items marked as actual OR items without a type (for backward compatibility)
      filtered = filtered.filter(item => item.type === 'actual' || !item.type);
    }
    // If itemFilter is 'all', don't filter by type
    
    return filtered;
  };

  const calculateTotals = () => {
    const totalBudget = parseFloat(weddingData.budget) || 0;
    
    // Only count actual expenses (not planned items) toward total spent
    const totalSpent = budgetItems
      .filter(item => item.type === 'actual' || !item.type) // Include actual items or items without type (backward compatibility)
      .reduce((sum, item) => sum + (parseFloat(item.actual_cost) || 0), 0);
    
    // Count all planned costs (both planned and actual items can have planned costs)
    const totalPlanned = budgetItems.reduce((sum, item) => sum + (parseFloat(item.planned_cost) || 0), 0);
    
    const remaining = totalBudget - totalSpent;
    const overBudget = totalSpent > totalBudget;

    return {
      totalBudget,
      totalSpent,
      totalPlanned,
      remaining,
      overBudget
    };
  };

  const getCategoryTotals = () => {
    const categoryTotals = {};
    budgetCategories.forEach(category => {
      const items = budgetItems.filter(item => item.category === category.id);
      
      // Only count actual expenses (not planned items) toward spent
      const spent = Math.round(items
        .filter(item => item.type === 'actual' || !item.type) // Include actual items or items without type (backward compatibility)
        .reduce((sum, item) => sum + (parseFloat(item.actual_cost) || 0), 0));
      
      // Count all planned costs (both planned and actual items can have planned costs)
      const planned = Math.round(items.reduce((sum, item) => sum + (parseFloat(item.planned_cost) || 0), 0));
      
      categoryTotals[category.id] = { spent, planned, category };
    });
    return categoryTotals;
  };

  // Get available categories (excluding removed ones)
  const getAvailableCategories = () => {
    return budgetCategories.filter(category => !excludedCategories.includes(category.id));
  };

  // Load saved ranking on mount
  useEffect(() => {
    loadSavedRanking();
  }, []);

  // Update ranking when categories change (e.g., after removing/restoring)
  useEffect(() => {
    // Ensure ranking only includes available categories
    const availableCategories = getAvailableCategories();
    setCategoryRanking(prev => {
      const validRanking = prev.filter(id => availableCategories.some(cat => cat.id === id));
      const missingCategories = availableCategories.filter(cat => !validRanking.includes(cat.id));
      return [...validRanking, ...missingCategories.map(cat => cat.id)];
    });
  }, [excludedCategories, budgetCategories]);

  // Removed automatic calculation - will be triggered by button click instead

  const loadSavedRanking = async () => {
    try {
      // Load budget items with planner data
      const { data: budgetItemsWithPlanner, error } = await supabase
        .from('wedding_budget_items')
        .select('*')
        .eq('wedding_id', weddingData.id)
        .order('ranking', { ascending: true });

      if (error) {
        console.error('Error loading budget planner data:', error);
        setCategoryRanking(getAvailableCategories().map(cat => cat.id));
        return;
      }

      // Extract planner data from budget items
      const plannerData = budgetItemsWithPlanner || [];
      
      // Build category ranking from items with ranking
      const rankedCategories = plannerData
        .filter(item => item.ranking !== null && item.ranking !== undefined)
        .sort((a, b) => a.ranking - b.ranking)
        .map(item => item.category);

      // Add any missing categories to the ranking
      const availableCategories = getAvailableCategories();
      const missingCategories = availableCategories
        .filter(cat => !rankedCategories.includes(cat.id))
        .map(cat => cat.id);

      setCategoryRanking([...rankedCategories, ...missingCategories]);

      // Build planned budget from items with planned_cost
      const newPlannedBudget = {};
      plannerData.forEach(item => {
        if (item.planned_cost && item.planned_cost > 0) {
          newPlannedBudget[item.category] = {
            amount: item.planned_cost,
            percentage: totalBudget > 0 ? (item.planned_cost / totalBudget) * 100 : 0
          };
        }
      });
      setPlannedBudget(newPlannedBudget);

      // Build excluded categories from items marked as excluded
      const excludedCats = plannerData
        .filter(item => item.excluded === true)
        .map(item => item.category);
      setExcludedCategories(excludedCats);

      // Check if we have calculated budget
      setHasCalculatedBudget(Object.keys(newPlannedBudget).length > 0);

    } catch (error) {
      console.error('Error loading saved ranking:', error);
      setCategoryRanking(getAvailableCategories().map(cat => cat.id));
    }
  };

  // Drag-and-drop handlers
  const handleDragStart = (e, index) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, dropIndex) => {
    e.preventDefault();
    const dragIndex = parseInt(e.dataTransfer.getData('text/plain'), 10);
    if (dragIndex === dropIndex) return;
    const newRanking = [...categoryRanking];
    const [removed] = newRanking.splice(dragIndex, 1);
    newRanking.splice(dropIndex, 0, removed);
    setCategoryRanking(newRanking);
  };

  // Mobile-friendly reordering handlers
  const moveCategoryUp = (categoryId) => {
    const currentIndex = categoryRanking.indexOf(categoryId);
    if (currentIndex > 0) {
      const newRanking = [...categoryRanking];
      [newRanking[currentIndex], newRanking[currentIndex - 1]] = [newRanking[currentIndex - 1], newRanking[currentIndex]];
      setCategoryRanking(newRanking);
    }
  };

  const moveCategoryDown = (categoryId) => {
    const currentIndex = categoryRanking.indexOf(categoryId);
    if (currentIndex < categoryRanking.length - 1) {
      const newRanking = [...categoryRanking];
      [newRanking[currentIndex], newRanking[currentIndex + 1]] = [newRanking[currentIndex + 1], newRanking[currentIndex]];
      setCategoryRanking(newRanking);
    }
  };

  // Budget allocation based on ranking
  const calculateRecommendedBudget = () => {
    const newPlannedBudget = {};
    const availableCategories = getAvailableCategories();
    // Use ranking order for weights
    const weights = [1.5, 1.3, 1.1]; // Top 3 get more, rest get 1
    const ranking = categoryRanking.length ? categoryRanking : availableCategories.map(cat => cat.id);
    const weightedCategories = availableCategories.map((cat, i) => {
      const rank = ranking.indexOf(cat.id);
      return { ...cat, weight: weights[rank] || 1 };
    });
    // Calculate total weight
    const totalWeight = weightedCategories.reduce((sum, cat) => sum + (defaultRecommendations[cat.id]?.percentage || 10) * cat.weight, 0);
    // Distribute budget
    weightedCategories.forEach(cat => {
      const basePercent = defaultRecommendations[cat.id]?.percentage || 10;
      const weightedPercent = (basePercent * cat.weight) / totalWeight;
      const amount = totalBudget * weightedPercent;
      newPlannedBudget[cat.id] = {
        amount: Math.round(amount),
        percentage: totalBudget > 0 ? (amount / totalBudget) * 100 : 0
      };
    });
    setPlannedBudget(newPlannedBudget);
    setHasCalculatedBudget(true);
  };

  const handleBudgetAdjustment = (categoryId, amount) => {
    const numAmount = Math.round(parseFloat(amount) || 0);
    const newPlannedBudget = { ...plannedBudget };
    
    if (numAmount > 0) {
      newPlannedBudget[categoryId] = {
        amount: numAmount,
        percentage: totalBudget > 0 ? (numAmount / totalBudget) * 100 : 0
      };
    } else {
      delete newPlannedBudget[categoryId];
    }
    
    setPlannedBudget(newPlannedBudget);
  };

  const handleRemoveCategory = (categoryId) => {
    // Remove from focus areas if it's there
    setFocusAreas(prev => prev.filter(id => id !== categoryId));
    
    // Remove from planned budget
    const newPlannedBudget = { ...plannedBudget };
    delete newPlannedBudget[categoryId];
    setPlannedBudget(newPlannedBudget);
    
    // Add to excluded categories
    setExcludedCategories(prev => [...prev, categoryId]);
  };

  const handleRestoreCategory = (categoryId) => {
    // Remove from excluded categories
    setExcludedCategories(prev => prev.filter(id => id !== categoryId));
  };

  const savePlannedBudget = async () => {
    try {
      const now = new Date().toISOString();
      
      // First, delete any existing planner rows for this wedding
      const { error: deleteError } = await supabase
        .from('wedding_budget_items')
        .delete()
        .eq('wedding_id', weddingData.id)
        .not('ranking', 'is', null); // Only delete rows that have ranking (planner rows)

      if (deleteError) {
        console.error('Error deleting existing planner data:', deleteError);
        toast.error('Failed to clear existing budget plan');
        return;
      }

      // Get all available categories (including excluded ones)
      const allCategories = getAvailableCategories();
      const excludedCategoriesSet = new Set(excludedCategories);
      
      // Prepare new planner rows for ALL categories
      const newRows = [];
      
      // First, add ranked categories
      categoryRanking.forEach((categoryId, idx) => {
        const planned = plannedBudget[categoryId]?.amount || 0;
        const excluded = excludedCategoriesSet.has(categoryId);
        const category = budgetCategories.find(cat => cat.id === categoryId);
        newRows.push({
          wedding_id: weddingData.id,
          category: categoryId,
          name: category ? `${category.name} Budget` : 'Budget',
          planned_cost: planned,
          type: 'planned', // Set type to planned for budget planner items
          ranking: idx,
          excluded,
          created_at: now,
          updated_at: now,
        });
      });
      
      // Then, add excluded categories that aren't in the ranking
      excludedCategories.forEach(categoryId => {
        if (!categoryRanking.includes(categoryId)) {
          const category = budgetCategories.find(cat => cat.id === categoryId);
          newRows.push({
            wedding_id: weddingData.id,
            category: categoryId,
            name: category ? `${category.name} Budget` : 'Budget',
            planned_cost: 0,
            type: 'planned', // Set type to planned for budget planner items
            ranking: null, // No ranking for excluded categories
            excluded: true,
            created_at: now,
            updated_at: now,
          });
        }
      });

      // Insert all new planner rows
      const { error: insertError } = await supabase
        .from('wedding_budget_items')
        .insert(newRows);

      if (insertError) {
        console.error('Error saving budget planner data:', insertError);
        toast.error('Failed to save budget plan');
        return;
      }

      // Try to update wedding budget (total) - but don't fail if wedding doesn't exist
      try {
        // First check if the wedding exists
        const { data: wedding, error: checkError } = await supabase
          .from('weddings')
          .select('id')
          .eq('id', weddingData.id)
          .single();

        if (checkError) {
          console.warn('Wedding not found, skipping budget update:', checkError);
          // Continue without updating wedding budget
        } else if (wedding) {
          // Wedding exists, update the budget
          const { error: updateWeddingError } = await supabase
            .from('weddings')
            .update({ budget: totalBudget })
            .eq('id', weddingData.id);
          
          if (updateWeddingError) {
            console.error('Error updating wedding budget:', updateWeddingError);
            // Don't fail the whole operation, just log the error
          }
        }
      } catch (weddingError) {
        console.warn('Error checking/updating wedding:', weddingError);
        // Continue without updating wedding budget
      }

      toast.success('Budget plan saved successfully!');
      if (onUpdate) {
        onUpdate({ budget: totalBudget });
      }
    } catch (error) {
      console.error('Error saving budget plan:', error);
      toast.error(`Failed to save budget plan: ${error.message}`);
    }
  };

  const getTotalPlanned = () => {
    return Math.round(Object.values(plannedBudget).reduce((sum, item) => sum + (item.amount || 0), 0));
  };

  const getRemainingBudget = () => {
    return Math.round(totalBudget - getTotalPlanned());
  };

  if (compact) {
    const totals = calculateTotals();
    const categoryTotals = getCategoryTotals();
    const topCategories = Object.entries(categoryTotals)
      .filter(([_, data]) => data.spent > 0)
      .sort(([_, a], [__, b]) => b.spent - a.spent)
      .slice(0, 3);

    return (
      <div className="budget-tracker-compact">
        <div className="budget-summary">
          <div className="budget-total">
            <span className="total-label">Total Budget</span>
            <span className="total-amount">${totals.totalBudget.toLocaleString()}</span>
          </div>
          <div className="budget-spent">
            <span className="spent-label">Spent</span>
            <span className={`spent-amount ${totals.overBudget ? 'over-budget' : ''}`}>
              ${totals.totalSpent.toLocaleString()}
            </span>
          </div>
          <div className="budget-remaining">
            <span className="remaining-label">Remaining</span>
            <span className={`remaining-amount ${totals.overBudget ? 'over-budget' : ''}`}>
              ${totals.remaining.toLocaleString()}
            </span>
          </div>
        </div>
        
        <div className="budget-progress">
          <div 
            className="progress-bar" 
            style={{ 
              width: `${totals.totalBudget > 0 ? Math.min((totals.totalSpent / totals.totalBudget) * 100, 100) : 0}%`,
              backgroundColor: totals.overBudget ? '#ef4444' : '#10b981'
            }}
          ></div>
        </div>

        {topCategories.length > 0 && (
          <div className="top-categories">
            <h4>Top Expenses</h4>
            {topCategories.map(([categoryId, data]) => {
              const category = budgetCategories.find(c => c.id === categoryId);
              return (
                <div key={categoryId} className="category-item">
                  <div className="category-info">
                    <i className={category.icon} style={{ color: category.color }}></i>
                    <span>{category.name}</span>
                  </div>
                  <span className="category-amount">${data.spent.toLocaleString()}</span>
                </div>
              );
            })}
          </div>
        )}

        {/* Compact Pie Chart */}
        <div className="compact-pie-chart">
          <BudgetPieChart budgetItems={budgetItems} budgetCategories={budgetCategories} onAddExpense={() => setShowAddItem(true)} />
        </div>

        <button 
          className="add-budget-btn-compact"
          onClick={() => setShowAddItem(true)}
        >
          <i className="fas fa-plus"></i>
          Add Expense
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="budget-tracker-loading">
        <div className="loading-spinner"></div>
        <p>Loading budget...</p>
      </div>
    );
  }

  const totals = calculateTotals();
  const categoryTotals = getCategoryTotals();

  return (
    <div className="budget-tracker">
      
      {/* Tab Navigation */}
      <div className="budget-tabs">
        <button 
          className={`tab-btn ${activeTab === 'tracker' ? 'active' : ''}`}
          onClick={() => setActiveTab('tracker')}
        >
          <i className="fas fa-chart-line"></i>
          Budget Tracker
        </button>
        <button 
          className={`tab-btn ${activeTab === 'planner' ? 'active' : ''}`}
          onClick={() => setActiveTab('planner')}
        >
          <i className="fas fa-calculator"></i>
          Budget Planner
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'tracker' && (
        <div className="tracker-content">
          <div className="budget-tracker-header">
            <h2>Budget Tracker</h2>
            <div className="budget-tracker-actions">
              <button 
                className="manage-categories-btn"
                onClick={() => setShowCategoryManager(true)}
              >
                <i className="fas fa-tags"></i>
                Manage Categories
              </button>
              <button 
                className="add-budget-btn"
                onClick={() => setShowAddItem(true)}
              >
                <i className="fas fa-plus"></i>
                Add Expense
              </button>
            </div>
          </div>

          {/* Budget Overview */}
          <div className="budget-overview">
            <div className="budget-card total-budget">
              <h3>Total Budget</h3>
              <div className="budget-amount">${totals.totalBudget.toLocaleString()}</div>
            </div>
            
            <div className="budget-card total-spent">
              <h3>Total Spent</h3>
              <div className={`budget-amount ${totals.overBudget ? 'over-budget' : ''}`}>
                ${totals.totalSpent.toLocaleString()}
              </div>
            </div>
            
            <div className="budget-card total-planned">
              <h3>Planned</h3>
              <div className="budget-amount">${totals.totalPlanned.toLocaleString()}</div>
            </div>
            
            <div className="budget-card remaining">
              <h3>Remaining</h3>
              <div className={`budget-amount ${totals.overBudget ? 'over-budget' : ''}`}>
                ${totals.remaining.toLocaleString()}
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="budget-progress-container">
            <div className="progress-labels">
              <span>Spent: ${totals.totalSpent.toLocaleString()}</span>
              <span>Remaining: ${totals.remaining.toLocaleString()}</span>
            </div>
            <div className="budget-progress">
              <div 
                className="progress-bar" 
                style={{ 
                  width: `${totals.totalBudget > 0 ? Math.min((totals.totalSpent / totals.totalBudget) * 100, 100) : 0}%`,
                  backgroundColor: totals.overBudget ? '#ef4444' : '#10b981'
                }}
              ></div>
            </div>
          </div>

          {/* Pie Chart Section */}
          <div className="budget-charts-section">
            <BudgetPieChart budgetItems={budgetItems} budgetCategories={budgetCategories} onAddExpense={() => setShowAddItem(true)} />
          </div>

          {/* Category Filter */}
          <div className="category-filter-budget-tracker">
            <div className="filter-row">
              <select 
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="category-select"
              >
                <option value="all">All Categories</option>
                {budgetCategories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              
              <select 
                value={itemFilter}
                onChange={(e) => setItemFilter(e.target.value)}
                className="item-type-select"
              >
                <option value="all">All Items</option>
                <option value="planned">Planned Budget</option>
                <option value="actual">Actual Expenses</option>
              </select>
            </div>
          </div>

          {/* Budget Items */}
          <div className="budget-items">
            <h3>Budget Items</h3>
            {getFilteredItems().length === 0 ? (
              <div className="no-budget-items">
                <p>No budget items added yet.</p>
                <button 
                  className="add-budget-btn"
                  onClick={() => setShowAddItem(true)}
                >
                  Add Your First Expense
                </button>
              </div>
            ) : (
              <div className="budget-items-grid">
                {getFilteredItems().map(item => (
                  <div key={item.id} className={`budget-item-card ${item.type === 'planned' ? 'planned-item' : 'actual-item'}`}>
                    <div className="item-header">
                      <div className="item-info">
                        <h4>{item.name}</h4>
                        <div className="item-meta">
                          <p>{budgetCategories.find(c => c.id === item.category)?.name}</p>
                          {item.type === 'planned' && (
                            <span className="item-type-badge planned">
                              <i className="fas fa-calculator"></i>
                              Planned Budget
                            </span>
                          )}
                          {(!item.type || item.type === 'actual') && (
                            <span className="item-type-badge actual">
                              <i className="fas fa-receipt"></i>
                              Actual Expense
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="item-actions">
                        <button 
                          className="edit-item-btn"
                          onClick={() => setShowAddItem({ ...item, isEditing: true })}
                        >
                          <i className="fas fa-edit"></i>
                        </button>
                        <button 
                          className="delete-item-btn"
                          onClick={() => deleteBudgetItem(item.id)}
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                      </div>
                    </div>
                    
                    <div className="item-costs">
                      {item.type === 'planned' ? (
                        <div className="cost-item">
                          <span className="cost-label">Planned Budget:</span>
                          <span className="cost-amount">${parseFloat(item.planned_cost || 0).toLocaleString()}</span>
                        </div>
                      ) : (
                        <div className="cost-item">
                          <span className="cost-label">Actual Cost:</span>
                          <span className="cost-amount">${parseFloat(item.actual_cost || 0).toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                    
                    {item.notes && (
                      <div className="item-notes">
                        <p>{item.notes}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Category Breakdown */}
          <div className="category-breakdown">
            <h3>Category Breakdown</h3>
            <div className="category-grid">
              {budgetCategories.map(category => {
                const data = categoryTotals[category.id];
                const itemCount = budgetItems.filter(item => item.category === category.id).length;
                
                // Skip categories with no data
                if (!data) return null;
                
                return (
                  <div key={category.id} className="category-card">
                    <div className="category-header">
                      <div className="category-icon" style={{ backgroundColor: category.color }}>
                        <i className={category.icon}></i>
                      </div>
                      <div className="category-info">
                        <h4>{category.name}</h4>
                        <p>{itemCount} items</p>
                      </div>
                    </div>
                    <div className="category-amounts">
                      <div className="amount-item">
                        <span>Planned: ${data.planned.toLocaleString()}</span>
                      </div>
                      <div className="amount-item">
                        <span>Spent: ${data.spent.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'planner' && (
        <BudgetPlanner 
          weddingData={weddingData} 
          budgetItems={budgetItems} 
          budgetCategories={budgetCategories}
          onUpdate={loadBudgetItems}
          setShowCategoryManager={setShowCategoryManager}
        />
      )}

      {/* Add/Edit Budget Item Modal */}
      {showAddItem && (
        <div className="modal-overlay" onClick={() => setShowAddItem(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>{showAddItem.isEditing ? 'Edit Budget Item' : 'Add Budget Item'}</h3>
            <BudgetItemForm 
              onSubmit={showAddItem.isEditing ? 
                (data) => updateBudgetItem(showAddItem.id, data) : 
                addBudgetItem
              }
              onCancel={() => setShowAddItem(false)}
              categories={budgetCategories}
              initialData={showAddItem.isEditing ? showAddItem : null}
              weddingData={weddingData}
            />
          </div>
        </div>
      )}

      {/* Category Manager Modal */}
      {showCategoryManager && (
        <div className="modal-overlay" onClick={() => setShowCategoryManager(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Manage Categories</h3>
            <CategoryManager 
              categories={customCategories}
              onAdd={addCustomCategory}
              onRemove={removeCustomCategory}
              onUnhide={unhideCategory}
              onCancel={() => setShowCategoryManager(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// Budget Item Form Component
function BudgetItemForm({ onSubmit, onCancel, categories, initialData, weddingData }) {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    category: initialData?.category || '',
    type: initialData?.type || 'actual', // Add type field
    planned_cost: initialData?.planned_cost || '',
    actual_cost: initialData?.actual_cost || '',
    notes: initialData?.notes || ''
  });
  const [plannedBudget, setPlannedBudget] = useState({});
  const [loading, setLoading] = useState(false);

  // Load planned budget from budget planner
  useEffect(() => {
    loadPlannedBudget();
  }, []);

  const loadPlannedBudget = async () => {
    try {
      setLoading(true);
      console.log('Loading planned budget for user:', weddingData.user_id);
      
      const { data: preferences, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', weddingData.user_id)
        .eq('preference_type', 'budget_priorities')
        .single();

      if (error) {
        console.error('Error loading planned budget:', error);
        return;
      }

      console.log('Loaded preferences:', preferences);

      if (preferences && preferences.preference_data) {
        const plannedBudgetData = preferences.preference_data.planned_budget || {};
        console.log('Setting planned budget:', plannedBudgetData);
        setPlannedBudget(plannedBudgetData);
      } else {
        console.log('No planned budget data found');
        setPlannedBudget({});
      }
    } catch (error) {
      console.error('Error loading planned budget:', error);
      setPlannedBudget({});
    } finally {
      setLoading(false);
    }
  };

  // Auto-fill planned cost when category changes
  useEffect(() => {
    if (formData.category && plannedBudget[formData.category] && !initialData) {
      setFormData(prev => ({
        ...prev,
        planned_cost: plannedBudget[formData.category].amount.toString()
      }));
    }
  }, [formData.category, plannedBudget, initialData]);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // For planned items, use the user's input. For actual items, use the budget planner amount as planned cost
    const submissionData = {
      ...formData,
      planned_cost: formData.type === 'planned' 
        ? formData.planned_cost 
        : getPlannedAmount().toString()
    };
    
    onSubmit(submissionData);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const getPlannedAmount = () => {
    if (!formData.category) {
      console.log('No category selected');
      return 0;
    }
    if (!plannedBudget[formData.category]) {
      console.log('No planned budget for category:', formData.category);
      console.log('Available planned budget data:', plannedBudget);
      return 0;
    }
    console.log('Planned amount for', formData.category, ':', plannedBudget[formData.category].amount);
    return plannedBudget[formData.category].amount;
  };

  const getActualAmount = () => {
    return parseFloat(formData.actual_cost) || 0;
  };

  const getDifference = () => {
    const planned = getPlannedAmount();
    const actual = getActualAmount();
    return actual - planned;
  };

  const getDifferencePercentage = () => {
    const planned = getPlannedAmount();
    if (planned === 0) return 0;
    return ((getDifference() / planned) * 100);
  };

  const getStatusColor = () => {
    const diff = getDifference();
    if (diff <= 0) return '#10b981'; // Green for under/at budget
    if (diff <= plannedBudget[formData.category]?.amount * 0.1) return '#f59e0b'; // Yellow for slightly over
    return '#ef4444'; // Red for significantly over
  };

  const getStatusText = () => {
    const diff = getDifference();
    const percentage = getDifferencePercentage();
    
    if (diff <= 0) {
      return `Under budget by $${Math.abs(diff).toLocaleString()} (${Math.abs(percentage).toFixed(1)}%)`;
    } else {
      return `Over budget by $${diff.toLocaleString()} (${percentage.toFixed(1)}%)`;
    }
  };

  return (
    <form onSubmit={handleSubmit} className="budget-item-form">
      <div className="form-group">
        <label htmlFor="name">Item Name</label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="e.g., Wedding Dress, Photography Package"
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="category">Category</label>
        <select
          id="category"
          name="category"
          value={formData.category}
          onChange={handleChange}
          required
        >
          <option value="">Select Category</option>
          {categories.map(category => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label htmlFor="type">Item Type</label>
        <select
          id="type"
          name="type"
          value={formData.type}
          onChange={handleChange}
          required
        >
          <option value="actual">Actual Expense</option>
          <option value="planned">Planned Budget</option>
        </select>
        <small className="form-help">
          {formData.type === 'actual' 
            ? 'Use this for expenses you have already paid or committed to'
            : 'Use this for budget planning and estimates'
          }
        </small>
      </div>

      {formData.type === 'actual' && (
        <div className="form-group">
          <label htmlFor="actual_cost">Actual Cost</label>
          <input
            type="number"
            id="actual_cost"
            name="actual_cost"
            value={formData.actual_cost}
            onChange={handleChange}
            placeholder="0.00"
            step="0.01"
            min="0"
            required
          />
        </div>
      )}

      {formData.type === 'planned' && (
        <div className="form-group">
          <label htmlFor="planned_cost">Planned Budget</label>
          <input
            type="number"
            id="planned_cost"
            name="planned_cost"
            value={formData.planned_cost}
            onChange={handleChange}
            placeholder="0.00"
            step="0.01"
            min="0"
            required
          />
        </div>
      )}

      <div className="form-group">
        <label htmlFor="notes">Notes</label>
        <textarea
          id="notes"
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          placeholder="Any additional notes about this expense"
          rows="3"
        />
      </div>

      <div className="form-actions">
        <button type="button" onClick={onCancel} className="cancel-btn">
          Cancel
        </button>
        <button type="submit" className="submit-btn">
          {initialData ? 'Update Item' : 'Add Item'}
        </button>
      </div>
    </form>
  );
}

// Pie Chart Component
function BudgetPieChart({ budgetItems, budgetCategories, onAddExpense }) {
  const [showPlanned, setShowPlanned] = useState(false);
  
  const getCategoryTotals = () => {
    const categoryTotals = {};
    budgetCategories.forEach(category => {
      const items = budgetItems.filter(item => item.category === category.id);
      
      // Only count actual expenses (not planned items) toward spent
      const spent = Math.round(items
        .filter(item => item.type === 'actual' || !item.type) // Include actual items or items without type (backward compatibility)
        .reduce((sum, item) => sum + (parseFloat(item.actual_cost) || 0), 0));
      
      // Count all planned costs (both planned and actual items can have planned costs)
      const planned = Math.round(items.reduce((sum, item) => sum + (parseFloat(item.planned_cost) || 0), 0));
      
      categoryTotals[category.id] = { spent, planned, category };
    });
    return categoryTotals;
  };

  const categoryTotals = getCategoryTotals();
  const categoriesWithData = Object.entries(categoryTotals)
    .filter(([_, data]) => data.spent > 0 || data.planned > 0)
    .sort(([_, a], [__, b]) => {
      const aTotal = showPlanned ? a.planned : a.spent;
      const bTotal = showPlanned ? b.planned : b.spent;
      return bTotal - aTotal;
    });

  // Check if there are any actual expenses
  const hasActualExpenses = budgetItems
    .filter(item => item.type === 'actual' || !item.type) // Include actual items or items without type (backward compatibility)
    .some(item => parseFloat(item.actual_cost) > 0);
  const hasPlannedBudget = budgetItems.some(item => parseFloat(item.planned_cost) > 0);

  // Show different messages based on the selected view and available data
  if (showPlanned && !hasPlannedBudget) {
    return (
      <div className="pie-chart-container">
        <div className="chart-header">
          <h3>Spending Breakdown</h3>
          <div className="budget-toggle">
            <button 
              className={`toggle-btn-budget-tracker ${!showPlanned ? 'active' : ''}`}
              onClick={() => setShowPlanned(false)}
            >
              <i className="fas fa-dollar-sign"></i>
              Actual
            </button>
            <button 
              className={`toggle-btn-budget-tracker ${showPlanned ? 'active' : ''}`}
              onClick={() => setShowPlanned(true)}
            >
              <i className="fas fa-calendar-alt"></i>
              Planned
            </button>
          </div>
        </div>
        <div className="no-data-message">
          <i className="fas fa-calendar-alt"></i>
          <p>No planned budget set yet</p>
          <span>Use the Budget Planner to set your planned spending</span>
        </div>
      </div>
    );
  }

  if (!showPlanned && !hasActualExpenses) {
    return (
      <div className="pie-chart-container">
        <div className="chart-header">
          <h3>Spending Breakdown</h3>
          <div className="budget-toggle">
            <button 
              className={`toggle-btn-budget-tracker ${!showPlanned ? 'active' : ''}`}
              onClick={() => setShowPlanned(false)}
            >
              <i className="fas fa-dollar-sign"></i>
              Actual
            </button>
            <button 
              className={`toggle-btn-budget-tracker ${showPlanned ? 'active' : ''}`}
              onClick={() => setShowPlanned(true)}
            >
              <i className="fas fa-calendar-alt"></i>
              Planned
            </button>
          </div>
        </div>
        <div className="no-data-message add-expense-cta">
          <i className="fas fa-plus-circle"></i>
          <p>No expenses tracked yet</p>
          <span>Start tracking your wedding expenses to see your spending breakdown</span>
          <button 
            className="add-expense-btn"
            onClick={onAddExpense}
          >
            <i className="fas fa-plus" style={{ color: 'white', alignItems: 'center', justifyContent: 'center', display: 'flex', marginBottom:'0px' }}></i>
            Add Your First Expense
          </button>
        </div>
      </div>
    );
  }

  if (categoriesWithData.length === 0) {
    return (
      <div className="pie-chart-container">
        <div className="chart-header">
          <h3>Spending Breakdown</h3>
          <div className="budget-toggle">
            <button 
              className={`toggle-btn-budget-tracker ${!showPlanned ? 'active' : ''}`}
              onClick={() => setShowPlanned(false)}
            >
              <i className="fas fa-dollar-sign"></i>
              Actual
            </button>
            <button 
              className={`toggle-btn-budget-tracker ${showPlanned ? 'active' : ''}`}
              onClick={() => setShowPlanned(true)}
            >
              <i className="fas fa-calendar-alt"></i>
              Planned
            </button>
          </div>
        </div>
        <div className="no-data-message">
          <i className="fas fa-chart-pie"></i>
          <p>No budget data available yet</p>
          <span>Add some expenses to see your spending breakdown</span>
        </div>
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
                    duration: 800,
      easing: 'easeOutQuart',
      animateRotate: true,
      animateScale: true,
      delay: (context) => context.dataIndex * 100
    },
    plugins: {
      legend: {
        display: window.innerWidth >= 768, // Hide legend on mobile
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
        bottom: window.innerWidth >= 768 ? 20 : 10 // Less padding on mobile when no legend
      }
    }
  };

  const totalPlanned = categoriesWithData.reduce((sum, [_, data]) => sum + data.planned, 0);
  const totalActual = categoriesWithData.reduce((sum, [_, data]) => sum + data.spent, 0);
  const totalDifference = totalActual - totalPlanned;

  return (
    <div className="pie-chart-container">
      <div className="chart-header">
        <h3>Spending Breakdown</h3>
        <div className="budget-toggle">
          <button 
            className={`toggle-btn-budget-tracker ${!showPlanned ? 'active' : ''}`}
            onClick={() => setShowPlanned(false)}
          >
            <i className="fas fa-dollar-sign"></i>
            Actual
          </button>
          <button 
            className={`toggle-btn-budget-tracker ${showPlanned ? 'active' : ''}`}
            onClick={() => setShowPlanned(true)}
          >
            <i className="fas fa-calendar-alt"></i>
            Planned
          </button>
        </div>
      </div>
      
      <div className="pie-chart-wrapper">
        <Pie data={chartData} options={chartOptions} />
      </div>
      
      <div className="chart-summary">
        <div className="summary-item">
          <span className="label">Total Planned:</span>
          <span className="amount planned">${Math.round(totalPlanned).toLocaleString()}</span>
        </div>
        <div className="summary-item">
          <span className="label">Total Actual:</span>
          <span className="amount actual">${Math.round(totalActual).toLocaleString()}</span>
        </div>
        <div className="summary-item">
          <span className="label">Difference:</span>
          <span className={`amount difference ${totalDifference >= 0 ? 'over' : 'under'}`}>
            ${Math.round(Math.abs(totalDifference)).toLocaleString()} {totalDifference >= 0 ? 'Over' : 'Under'}
          </span>
        </div>
      </div>
    </div>
  );
}

// Budget Planning Component
function BudgetPlanner({ weddingData, budgetItems, budgetCategories, onUpdate, setShowCategoryManager }) {
  const [focusAreas, setFocusAreas] = useState([]);
  const [plannedBudget, setPlannedBudget] = useState({});
  const [totalBudget, setTotalBudget] = useState(parseFloat(weddingData.budget) || 0);
  const [excludedCategories, setExcludedCategories] = useState([]);
  const [categoryRanking, setCategoryRanking] = useState([]);
  const [hasCalculatedBudget, setHasCalculatedBudget] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Default budget recommendations based on industry averages
  const defaultRecommendations = {
    venue: { percentage: 35, description: "Venue typically takes the largest portion of your budget" },
    catering: { percentage: 25, description: "Food and beverage costs for your guests" },
    photography: { percentage: 12, description: "Professional photography preserves your memories" },
    videography: { percentage: 8, description: "Video captures your special moments" },
    dj: { percentage: 5, description: "Music and entertainment for your reception" },
    florist: { percentage: 8, description: "Beautiful flowers and decorations" },
    beauty: { percentage: 3, description: "Hair and makeup for the wedding party" },
    transportation: { percentage: 3, description: "Transportation for wedding party and guests" },
    officiant: { percentage: 1, description: "Wedding officiant services" },
    decor: { percentage: 8, description: "Decorations and rentals" },
    planning: { percentage: 10, description: "Professional wedding planning services" }
  };

  // Get available categories (excluding removed ones)
  const getAvailableCategories = () => {
    return budgetCategories.filter(category => !excludedCategories.includes(category.id));
  };

  // Load saved ranking on mount
  useEffect(() => {
    loadSavedRanking();
  }, []);

  // Update ranking when categories change (e.g., after removing/restoring)
  useEffect(() => {
    // Ensure ranking only includes available categories
    const availableCategories = getAvailableCategories();
    setCategoryRanking(prev => {
      const validRanking = prev.filter(id => availableCategories.some(cat => cat.id === id));
      const missingCategories = availableCategories.filter(cat => !validRanking.includes(cat.id));
      return [...validRanking, ...missingCategories.map(cat => cat.id)];
    });
  }, [excludedCategories, budgetCategories]);

  // Removed automatic calculation - will be triggered by button click instead

  const loadSavedRanking = async () => {
    try {
      // Load budget items with planner data
      const { data: budgetItemsWithPlanner, error } = await supabase
        .from('wedding_budget_items')
        .select('*')
        .eq('wedding_id', weddingData.id)
        .order('ranking', { ascending: true });

      if (error) {
        console.error('Error loading budget planner data:', error);
        setCategoryRanking(getAvailableCategories().map(cat => cat.id));
        return;
      }

      // Extract planner data from budget items
      const plannerData = budgetItemsWithPlanner || [];
      
      // Build category ranking from items with ranking
      const rankedCategories = plannerData
        .filter(item => item.ranking !== null && item.ranking !== undefined)
        .sort((a, b) => a.ranking - b.ranking)
        .map(item => item.category);

      // Add any missing categories to the ranking
      const availableCategories = getAvailableCategories();
      const missingCategories = availableCategories
        .filter(cat => !rankedCategories.includes(cat.id))
        .map(cat => cat.id);

      setCategoryRanking([...rankedCategories, ...missingCategories]);

      // Build planned budget from items with planned_cost
      const newPlannedBudget = {};
      plannerData.forEach(item => {
        if (item.planned_cost && item.planned_cost > 0) {
          newPlannedBudget[item.category] = {
            amount: item.planned_cost,
            percentage: totalBudget > 0 ? (item.planned_cost / totalBudget) * 100 : 0
          };
        }
      });
      setPlannedBudget(newPlannedBudget);

      // Build excluded categories from items marked as excluded
      const excludedCats = plannerData
        .filter(item => item.excluded === true)
        .map(item => item.category);
      setExcludedCategories(excludedCats);

      // Check if we have calculated budget
      setHasCalculatedBudget(Object.keys(newPlannedBudget).length > 0);

    } catch (error) {
      console.error('Error loading saved ranking:', error);
      setCategoryRanking(getAvailableCategories().map(cat => cat.id));
    }
  };

  // Drag-and-drop handlers
  const handleDragStart = (e, index) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, dropIndex) => {
    e.preventDefault();
    const dragIndex = parseInt(e.dataTransfer.getData('text/plain'), 10);
    if (dragIndex === dropIndex) return;
    const newRanking = [...categoryRanking];
    const [removed] = newRanking.splice(dragIndex, 1);
    newRanking.splice(dropIndex, 0, removed);
    setCategoryRanking(newRanking);
  };

  // Mobile-friendly reordering handlers
  const moveCategoryUp = (categoryId) => {
    const currentIndex = categoryRanking.indexOf(categoryId);
    if (currentIndex > 0) {
      const newRanking = [...categoryRanking];
      [newRanking[currentIndex], newRanking[currentIndex - 1]] = [newRanking[currentIndex - 1], newRanking[currentIndex]];
      setCategoryRanking(newRanking);
    }
  };

  const moveCategoryDown = (categoryId) => {
    const currentIndex = categoryRanking.indexOf(categoryId);
    if (currentIndex < categoryRanking.length - 1) {
      const newRanking = [...categoryRanking];
      [newRanking[currentIndex], newRanking[currentIndex + 1]] = [newRanking[currentIndex + 1], newRanking[currentIndex]];
      setCategoryRanking(newRanking);
    }
  };

  // Budget allocation based on ranking
  const calculateRecommendedBudget = () => {
    const newPlannedBudget = {};
    const availableCategories = getAvailableCategories();
    // Use ranking order for weights
    const weights = [1.5, 1.3, 1.1]; // Top 3 get more, rest get 1
    const ranking = categoryRanking.length ? categoryRanking : availableCategories.map(cat => cat.id);
    const weightedCategories = availableCategories.map((cat, i) => {
      const rank = ranking.indexOf(cat.id);
      return { ...cat, weight: weights[rank] || 1 };
    });
    // Calculate total weight
    const totalWeight = weightedCategories.reduce((sum, cat) => sum + (defaultRecommendations[cat.id]?.percentage || 10) * cat.weight, 0);
    // Distribute budget
    weightedCategories.forEach(cat => {
      const basePercent = defaultRecommendations[cat.id]?.percentage || 10;
      const weightedPercent = (basePercent * cat.weight) / totalWeight;
      const amount = totalBudget * weightedPercent;
      newPlannedBudget[cat.id] = {
        amount: Math.round(amount),
        percentage: totalBudget > 0 ? (amount / totalBudget) * 100 : 0
      };
    });
    setPlannedBudget(newPlannedBudget);
    setHasCalculatedBudget(true);
  };

  const handleBudgetAdjustment = (categoryId, amount) => {
    const numAmount = Math.round(parseFloat(amount) || 0);
    const newPlannedBudget = { ...plannedBudget };
    
    if (numAmount > 0) {
      newPlannedBudget[categoryId] = {
        amount: numAmount,
        percentage: totalBudget > 0 ? (numAmount / totalBudget) * 100 : 0
      };
    } else {
      delete newPlannedBudget[categoryId];
    }
    
    setPlannedBudget(newPlannedBudget);
  };

  const handleRemoveCategory = (categoryId) => {
    // Remove from focus areas if it's there
    setFocusAreas(prev => prev.filter(id => id !== categoryId));
    
    // Remove from planned budget
    const newPlannedBudget = { ...plannedBudget };
    delete newPlannedBudget[categoryId];
    setPlannedBudget(newPlannedBudget);
    
    // Add to excluded categories
    setExcludedCategories(prev => [...prev, categoryId]);
  };

  const handleRestoreCategory = (categoryId) => {
    // Remove from excluded categories
    setExcludedCategories(prev => prev.filter(id => id !== categoryId));
  };

  const savePlannedBudget = async () => {
    try {
      const now = new Date().toISOString();
      
      // First, delete any existing planner rows for this wedding
      const { error: deleteError } = await supabase
        .from('wedding_budget_items')
        .delete()
        .eq('wedding_id', weddingData.id)
        .not('ranking', 'is', null); // Only delete rows that have ranking (planner rows)

      if (deleteError) {
        console.error('Error deleting existing planner data:', deleteError);
        toast.error('Failed to clear existing budget plan');
        return;
      }

      // Get all available categories (including excluded ones)
      const allCategories = getAvailableCategories();
      const excludedCategoriesSet = new Set(excludedCategories);
      
      // Prepare new planner rows for ALL categories
      const newRows = [];
      
      // First, add ranked categories
      categoryRanking.forEach((categoryId, idx) => {
        const planned = plannedBudget[categoryId]?.amount || 0;
        const excluded = excludedCategoriesSet.has(categoryId);
        const category = budgetCategories.find(cat => cat.id === categoryId);
        newRows.push({
          wedding_id: weddingData.id,
          category: categoryId,
          name: category ? `${category.name} Budget` : 'Budget',
          planned_cost: planned,
          type: 'planned', // Set type to planned for budget planner items
          ranking: idx,
          excluded,
          created_at: now,
          updated_at: now,
        });
      });
      
      // Then, add excluded categories that aren't in the ranking
      excludedCategories.forEach(categoryId => {
        if (!categoryRanking.includes(categoryId)) {
          const category = budgetCategories.find(cat => cat.id === categoryId);
          newRows.push({
            wedding_id: weddingData.id,
            category: categoryId,
            name: category ? `${category.name} Budget` : 'Budget',
            planned_cost: 0,
            type: 'planned', // Set type to planned for budget planner items
            ranking: null, // No ranking for excluded categories
            excluded: true,
            created_at: now,
            updated_at: now,
          });
        }
      });

      // Insert all new planner rows
      const { error: insertError } = await supabase
        .from('wedding_budget_items')
        .insert(newRows);

      if (insertError) {
        console.error('Error saving budget planner data:', insertError);
        toast.error('Failed to save budget plan');
        return;
      }

      // Try to update wedding budget (total) - but don't fail if wedding doesn't exist
      try {
        // First check if the wedding exists
        const { data: wedding, error: checkError } = await supabase
          .from('weddings')
          .select('id')
          .eq('id', weddingData.id)
          .single();

        if (checkError) {
          console.warn('Wedding not found, skipping budget update:', checkError);
          // Continue without updating wedding budget
        } else if (wedding) {
          // Wedding exists, update the budget
          const { error: updateWeddingError } = await supabase
            .from('weddings')
            .update({ budget: totalBudget })
            .eq('id', weddingData.id);
          
          if (updateWeddingError) {
            console.error('Error updating wedding budget:', updateWeddingError);
            // Don't fail the whole operation, just log the error
          }
        }
      } catch (weddingError) {
        console.warn('Error checking/updating wedding:', weddingError);
        // Continue without updating wedding budget
      }

      toast.success('Budget plan saved successfully!');
      if (onUpdate) {
        onUpdate({ budget: totalBudget });
      }
    } catch (error) {
      console.error('Error saving budget plan:', error);
      toast.error(`Failed to save budget plan: ${error.message}`);
    }
  };

  const getTotalPlanned = () => {
    return Math.round(Object.values(plannedBudget).reduce((sum, item) => sum + (item.amount || 0), 0));
  };

  const getRemainingBudget = () => {
    return Math.round(totalBudget - getTotalPlanned());
  };

  return (
    <div className="budget-planner-tab">
      <div className="planner-header">
        <h2>Budget Planning Tool</h2>
        <p>Rank your categories by importance. Drag to reorder. The top categories will get more budget weight.</p>
      </div>

      <div className="budget-input-section">
        <label htmlFor="total-budget">Total Wedding Budget</label>
        <div className="budget-input-wrapper">
          <span className="currency-symbol">$</span>
          <input
            type="number"
            id="total-budget"
            value={totalBudget}
            onChange={(e) => {
              const newBudget = parseFloat(e.target.value) || 0;
              setTotalBudget(newBudget);
              // Removed automatic calculation - will be triggered by button click instead
            }}
            placeholder="Enter your total budget"
            min="0"
            step="100"
          />
        </div>
      </div>

      {/* Budget Planner Pie Chart */}
      <div className="budget-planner-chart-section">
        <h3>Planned Budget Breakdown</h3>
        <div className="planner-pie-chart-container">
          <div className="planner-pie-chart-wrapper">
            {getTotalPlanned() > 0 ? (
              <Pie
                data={{
                  labels: getAvailableCategories()
                    .filter(category => plannedBudget[category.id]?.amount > 0)
                    .map(category => category.name),
                  datasets: [{
                    data: getAvailableCategories()
                      .filter(category => plannedBudget[category.id]?.amount > 0)
                      .map(category => plannedBudget[category.id].amount),
                    backgroundColor: getAvailableCategories()
                      .filter(category => plannedBudget[category.id]?.amount > 0)
                      .map(category => category.color),
                    borderWidth: 2,
                    borderColor: '#ffffff',
                    hoverBorderWidth: 3,
                    hoverBorderColor: '#ffffff'
                  }]
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  animation: {
                    duration: 800,
                    easing: 'easeOutQuart',
                    animateRotate: true,
                    animateScale: true
                  },
                  plugins: {
                    legend: {
                      display: window.innerWidth >= 768, // Hide legend on mobile
                      position: 'bottom',
                      labels: {
                        padding: 24,
                        usePointStyle: true,
                        pointStyle: 'circle',
                        font: {
                          size: 13,
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
                      backgroundColor: 'rgba(0, 0, 0, 0.85)',
                      titleColor: '#ffffff',
                      bodyColor: '#ffffff',
                      borderColor: 'rgba(255, 255, 255, 0.2)',
                      borderWidth: 1,
                      cornerRadius: 12,
                      displayColors: true,
                      padding: 16,
                      titleFont: {
                        size: 14,
                        weight: '600'
                      },
                      bodyFont: {
                        size: 13
                      },
                      callbacks: {
                        label: (context) => {
                          const label = context.label || '';
                          const value = context.parsed;
                          const total = context.dataset.data.reduce((a, b) => a + b, 0);
                          const percentage = ((value / total) * 100).toFixed(1);
                          return `${label}: $${Math.round(value).toLocaleString()} (${percentage}%)`;
                        }
                      }
                    }
                  },
                  elements: {
                    arc: {
                      borderWidth: 3,
                      borderColor: '#ffffff',
                      hoverBorderWidth: 4,
                      hoverBorderColor: '#ffffff',
                      hoverOffset: 8
                    }
                  },
                  layout: {
                    padding: {
                      top: 20,
                      bottom: window.innerWidth >= 768 ? 20 : 10 // Less padding on mobile when no legend
                    }
                  }
                }}
              />
            ) : (
              <div className="no-data-message">
                <i className="fas fa-chart-pie"></i>
                <p>No budget planned yet</p>
                <span>Set your focus areas and budget amounts to see the breakdown</span>
              </div>
            )}
          </div>
          
          <div className="planner-chart-summary">
            <div className="summary-item">
              <span className="label">Total Planned:</span>
              <span className="amount">${getTotalPlanned().toLocaleString()}</span>
            </div>
            <div className="summary-item">
              <span className="label">Remaining:</span>
              <span className={`amount ${getRemainingBudget() < 0 ? 'over-budget' : 'under-budget'}`}>
                ${getRemainingBudget().toLocaleString()}
              </span>
            </div>
            <div className="summary-item">
              <span className="label">Categories Used:</span>
              <span className="count">
                {getAvailableCategories().filter(category => plannedBudget[category.id]?.amount > 0).length}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="focus-areas-section">
        <h3>Rank Your Categories</h3>
        <div className="focus-areas-grid">
          {categoryRanking
            .map(categoryId => getAvailableCategories().find(cat => cat.id === categoryId))
            .filter(category => category) // Filter out any undefined categories
            .map(category => {
              const index = categoryRanking.indexOf(category.id);
              return (
                <div
                  key={category.id}
                  className="focus-area-item"
                  {...(!isMobile ? {
                    draggable: true,
                    onDragStart: e => handleDragStart(e, index),
                    onDragOver: handleDragOver,
                    onDrop: e => handleDrop(e, index),
                    style: { opacity: 1, cursor: 'move' }
                  } : { style: { opacity: 1 } })}
                >
                  <div className="category-header">
                    <div className="category-icon" style={{ backgroundColor: category.color }}>
                      <span style={{ fontWeight: 700, fontSize: '1.1rem', color: '#fff', marginRight: 8 }}>{index + 1}</span>
                      <i className={category.icon}></i>
                    </div>
                    <div className="category-info">
                      <h4>{category.name}</h4>
                      <p>{defaultRecommendations[category.id]?.description}</p>
                    </div>
                    <div className="category-actions" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                      {isMobile && (
                        <>
                          <button
                            className="move-up-btn"
                            onClick={() => moveCategoryUp(category.id)}
                            disabled={index === 0}
                            title="Move up"
                            style={{ background: 'none', border: 'none', cursor: index === 0 ? 'not-allowed' : 'pointer', color: '#64748b', fontSize: '1rem', padding: 0 }}
                          >
                            <i className="fas fa-arrow-up"></i>
                          </button>
                          <button
                            className="move-down-btn"
                            onClick={() => moveCategoryDown(category.id)}
                            disabled={index === categoryRanking.length - 1}
                            title="Move down"
                            style={{ background: 'none', border: 'none', cursor: index === categoryRanking.length - 1 ? 'not-allowed' : 'pointer', color: '#64748b', fontSize: '1rem', padding: 0 }}
                          >
                            <i className="fas fa-arrow-down"></i>
                          </button>
                        </>
                      )}
                      <button
                        className="remove-category-btn"
                        onClick={() => handleRemoveCategory(category.id)}
                        title="Remove from budget planning"
                      >
                        <i className="fas fa-times"></i>
                      </button>
                    </div>
                  </div>
                  <div className="budget-allocation">
                    <label>Planned Amount:</label>
                    <div className="amount-input-wrapper">
                      <span className="currency-symbol">$</span>
                      <input
                        type="number"
                        value={plannedBudget[category.id]?.amount?.toFixed(0) || ''}
                        onChange={e => handleBudgetAdjustment(category.id, e.target.value)}
                        placeholder="0"
                        min="0"
                        step="100"
                      />
                    </div>
                    <span className="percentage">
                      {plannedBudget[category.id]?.percentage?.toFixed(1) || '0'}%
                    </span>
                  </div>
                </div>
              );
            })}
        </div>

        {/* Calculate Budget Button */}
        <div className="calculate-budget-section">
          <button 
            className={`calculate-budget-btn ${totalBudget > 0 && categoryRanking.length > 0 ? 'enabled' : 'disabled'}`}
            onClick={calculateRecommendedBudget}
            disabled={totalBudget <= 0 || categoryRanking.length === 0}
          >
            <i className="fas fa-calculator"></i>
            {hasCalculatedBudget ? 'Recalculate Budget' : 'Calculate Budget'}
          </button>
          {totalBudget <= 0 && (
            <p className="calculation-hint">Enter a total budget to calculate recommendations</p>
          )}
          {totalBudget > 0 && categoryRanking.length === 0 && (
            <p className="calculation-hint">Rank your categories to calculate recommendations</p>
          )}
        </div>

        {/* Removed Categories Section */}
        {excludedCategories.length > 0 && (
          <div className="removed-categories-section">
            <h4>Removed Categories</h4>
            <p>These categories have been removed from your budget planning. You can restore them if needed.</p>
            <div className="removed-categories-grid">
              {excludedCategories.map(categoryId => {
                const category = budgetCategories.find(cat => cat.id === categoryId);
                if (!category) return null;
                
                return (
                  <div key={categoryId} className="removed-category-item">
                    <div className="category-preview">
                      <div className="category-icon" style={{ backgroundColor: category.color }}>
                        <i className={category.icon}></i>
                      </div>
                      <span className="category-name">{category.name}</span>
                    </div>
                    <button
                      className="restore-category-btn"
                      onClick={() => handleRestoreCategory(categoryId)}
                      title="Restore category"
                    >
                      <i className="fas fa-plus"></i>
                      Restore
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className="budget-summary-section">
        <div className="summary-cards">
          <div className="summary-card">
            <span className="label">Total Budget</span>
            <span className="amount">${Math.round(totalBudget).toLocaleString()}</span>
          </div>
          <div className="summary-card">
            <span className="label">Planned Spending</span>
            <span className="amount">${getTotalPlanned().toLocaleString()}</span>
          </div>
          <div className="summary-card">
            <span className="label">Remaining</span>
            <span className={`amount ${getRemainingBudget() < 0 ? 'over-budget' : 'under-budget'}`}>
              ${getRemainingBudget().toLocaleString()}
            </span>
          </div>
        </div>
        
        <div className="budget-progress">
          <div 
            className="progress-bar" 
            style={{ 
              width: `${totalBudget > 0 ? Math.min((getTotalPlanned() / totalBudget) * 100, 100) : 0}%`,
              backgroundColor: getRemainingBudget() < 0 ? '#ef4444' : '#10b981'
            }}
          ></div>
        </div>
      </div>

      <div className="planner-actions">
        <button 
          className="save-btn"
          onClick={savePlannedBudget}
          disabled={getRemainingBudget() < 0}
        >
          <i className="fas fa-save"></i>
          Save Budget Plan
        </button>
      </div>
    </div>
  );
}

// Category Manager Component for BudgetTracker
function CategoryManager({ categories, onAdd, onRemove, onUnhide, onCancel }) {
  const [formData, setFormData] = useState({
    name: '',
    icon: 'fas fa-tag',
    color: '#667eea'
  });

  const iconOptions = [
    { value: 'fas fa-tag', label: 'Tag' },
    { value: 'fas fa-star', label: 'Star' },
    { value: 'fas fa-heart', label: 'Heart' },
    { value: 'fas fa-gem', label: 'Gem' },
    { value: 'fas fa-crown', label: 'Crown' },
    { value: 'fas fa-trophy', label: 'Trophy' },
    { value: 'fas fa-medal', label: 'Medal' },
    { value: 'fas fa-award', label: 'Award' },
    { value: 'fas fa-certificate', label: 'Certificate' },
    { value: 'fas fa-badge', label: 'Badge' },
    { value: 'fas fa-ribbon', label: 'Ribbon' },
    { value: 'fas fa-flag', label: 'Flag' }
  ];

  const colorOptions = [
    '#667eea', '#764ba2', '#f093fb', '#4facfe', '#43e97b', '#fa709a',
    '#a8edea', '#ffecd2', '#fc466b', '#ff9a9e', '#8b5cf6', '#06b6d4',
    '#10b981', '#f59e0b', '#ef4444', '#84cc16', '#f97316', '#ec4899'
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Please enter a category name');
      return;
    }
    onAdd(formData);
    setFormData({ name: '', icon: 'fas fa-tag', color: '#667eea' });
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="category-manager">
      <div className="add-category-section">
        <form onSubmit={handleSubmit} className="add-category-form">
          <div className="form-group">
            <label htmlFor="name">Category Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g., Wedding Planner, Cake Baker"
              required
            />
          </div>

          <div className="form-group">
            <label>Icon</label>
            <div className="icon-selector">
              {iconOptions.map(icon => (
                <button
                  key={icon.value}
                  type="button"
                  className={`icon-option ${formData.icon === icon.value ? 'selected' : ''}`}
                  onClick={() => setFormData({ ...formData, icon: icon.value })}
                  title={icon.label}
                >
                  <i className={icon.value}></i>
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>Color</label>
            <div className="color-selector">
              {colorOptions.map(color => (
                <button
                  key={color}
                  type="button"
                  className={`color-option ${formData.color === color ? 'selected' : ''}`}
                  style={{ backgroundColor: color }}
                  onClick={() => setFormData({ ...formData, color: color })}
                  title={color}
                ></button>
              ))}
            </div>
          </div>

          <div className="form-actions">
            <button type="button" onClick={onCancel} className="cancel-btn-checklist">
              Cancel
            </button>
            <button type="submit" className="submit-btn">
              Add Category
            </button>
          </div>
        </form>
      </div>

      {categories.length > 0 && (
        <div className="custom-categories-section">
          <h4>Custom Categories</h4>
          <div className="custom-categories-list">
            {categories.filter(cat => cat.is_custom).map(category => (
              <div key={category.id || category.category_id} className="custom-category-item">
                <div className="category-preview">
                  <div className="category-icon" style={{ backgroundColor: category.color || category.category_color }}>
                    <i className={category.icon || category.category_icon}></i>
                  </div>
                  <span className="category-name">{category.name || category.category_name}</span>
                </div>
                <button
                  className="remove-category-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemove(category.id || category.category_id);
                  }}
                  title="Remove category"
                >
                  <i className="fas fa-trash"></i>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Hidden Categories Section */}
      {categories.filter(cat => cat.is_hidden && !cat.is_custom).length > 0 && (
        <div className="hidden-categories-section">
          <h4>Hidden Categories</h4>
          <p className="section-description">These default categories are currently hidden. You can unhide them to make them visible again.</p>
          <div className="hidden-categories-list">
            {categories.filter(cat => cat.is_hidden && !cat.is_custom).map(category => (
              <div key={category.id || category.category_id} className="hidden-category-item">
                <div className="category-preview">
                  <div className="category-icon" style={{ backgroundColor: category.color || category.category_color }}>
                    <i className={category.icon || category.category_icon}></i>
                  </div>
                  <span className="category-name">{category.name || category.category_name}</span>
                  <span className="hidden-badge">Hidden</span>
                </div>
                <button
                  className="unhide-category-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    onUnhide(category.id || category.category_id);
                  }}
                  title="Unhide category"
                >
                  <i className="fas fa-eye"></i>
                  Unhide
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default BudgetTracker; 