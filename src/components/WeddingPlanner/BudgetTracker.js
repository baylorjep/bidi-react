import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { toast } from 'react-toastify';
import './BudgetTracker.css';

function BudgetTracker({ weddingData, onUpdate, compact = false }) {
  const [budgetItems, setBudgetItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddItem, setShowAddItem] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');

  const budgetCategories = [
    { id: 'venue', name: 'Venue & Catering', icon: 'fas fa-building', color: '#667eea' },
    { id: 'photography', name: 'Photography & Video', icon: 'fas fa-camera', color: '#764ba2' },
    { id: 'attire', name: 'Attire & Beauty', icon: 'fas fa-tshirt', color: '#f093fb' },
    { id: 'flowers', name: 'Flowers & Decor', icon: 'fas fa-flower', color: '#4facfe' },
    { id: 'music', name: 'Music & Entertainment', icon: 'fas fa-music', color: '#43e97b' },
    { id: 'transportation', name: 'Transportation', icon: 'fas fa-car', color: '#fa709a' },
    { id: 'stationery', name: 'Stationery & Paper', icon: 'fas fa-envelope', color: '#a8edea' },
    { id: 'rings', name: 'Rings & Jewelry', icon: 'fas fa-gem', color: '#ffecd2' },
    { id: 'other', name: 'Other Expenses', icon: 'fas fa-plus', color: '#fc466b' }
  ];

  useEffect(() => {
    if (weddingData) {
      loadBudgetItems();
    }
  }, [weddingData]);

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
      const { data, error } = await supabase
        .from('wedding_budget_items')
        .insert([{
          wedding_id: weddingData.id,
          ...itemData,
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;

      setBudgetItems([data, ...budgetItems]);
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
    if (selectedCategory === 'all') {
      return budgetItems;
    }
    return budgetItems.filter(item => item.category === selectedCategory);
  };

  const calculateTotals = () => {
    const totalBudget = parseFloat(weddingData.budget) || 0;
    const totalSpent = budgetItems.reduce((sum, item) => sum + (parseFloat(item.actual_cost) || 0), 0);
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
      const spent = items.reduce((sum, item) => sum + (parseFloat(item.actual_cost) || 0), 0);
      const planned = items.reduce((sum, item) => sum + (parseFloat(item.planned_cost) || 0), 0);
      categoryTotals[category.id] = { spent, planned, count: items.length };
    });
    return categoryTotals;
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
      <div className="budget-tracker-header">
        <h2>Budget Tracker</h2>
        <button 
          className="add-budget-btn"
          onClick={() => setShowAddItem(true)}
        >
          <i className="fas fa-plus"></i>
          Add Expense
        </button>
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

      {/* Category Filter */}
      <div className="category-filter">
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
              <div key={item.id} className="budget-item-card">
                <div className="item-header">
                  <div className="item-info">
                    <h4>{item.name}</h4>
                    <p>{budgetCategories.find(c => c.id === item.category)?.name}</p>
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
                  <div className="cost-item">
                    <span className="cost-label">Planned:</span>
                    <span className="cost-amount">${parseFloat(item.planned_cost || 0).toLocaleString()}</span>
                  </div>
                  <div className="cost-item">
                    <span className="cost-label">Actual:</span>
                    <span className="cost-amount">${parseFloat(item.actual_cost || 0).toLocaleString()}</span>
                  </div>
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
            return (
              <div key={category.id} className="category-card">
                <div className="category-header">
                  <div className="category-icon" style={{ backgroundColor: category.color }}>
                    <i className={category.icon}></i>
                  </div>
                  <div className="category-info">
                    <h4>{category.name}</h4>
                    <p>{data.count} items</p>
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
            />
          </div>
        </div>
      )}
    </div>
  );
}

// Budget Item Form Component
function BudgetItemForm({ onSubmit, onCancel, categories, initialData }) {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    category: initialData?.category || '',
    planned_cost: initialData?.planned_cost || '',
    actual_cost: initialData?.actual_cost || '',
    notes: initialData?.notes || ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
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

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="planned_cost">Planned Cost</label>
          <input
            type="number"
            id="planned_cost"
            name="planned_cost"
            value={formData.planned_cost}
            onChange={handleChange}
            placeholder="0.00"
            step="0.01"
            min="0"
          />
        </div>

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
          />
        </div>
      </div>

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

export default BudgetTracker; 