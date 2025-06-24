import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { toast } from 'react-toastify';
import './WeddingChecklist.css';

function WeddingChecklist({ weddingData, onUpdate, compact = false }) {
  const [checklistItems, setChecklistItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddItem, setShowAddItem] = useState(false);
  const [showEditItem, setShowEditItem] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedPriority, setSelectedPriority] = useState('all');
  const [sortBy, setSortBy] = useState('due_date');

  const defaultCategories = [
    { id: 'planning', name: 'Planning & Coordination', icon: 'fas fa-calendar-check', color: '#667eea' },
    { id: 'venue', name: 'Venue & Location', icon: 'fas fa-building', color: '#764ba2' },
    { id: 'vendors', name: 'Vendors & Services', icon: 'fas fa-handshake', color: '#f093fb' },
    { id: 'attire', name: 'Attire & Beauty', icon: 'fas fa-tshirt', color: '#4facfe' },
    { id: 'ceremony', name: 'Ceremony', icon: 'fas fa-church', color: '#43e97b' },
    { id: 'reception', name: 'Reception', icon: 'fas fa-glass-cheers', color: '#fa709a' },
    { id: 'travel', name: 'Travel & Accommodation', icon: 'fas fa-plane', color: '#a8edea' },
    { id: 'legal', name: 'Legal & Documentation', icon: 'fas fa-file-contract', color: '#ffecd2' },
    { id: 'decor', name: 'Decor & Design', icon: 'fas fa-palette', color: '#fc466b' },
    { id: 'other', name: 'Other', icon: 'fas fa-ellipsis-h', color: '#ff9a9e' }
  ];

  const priorityOptions = [
    { value: 'high', label: 'High Priority', color: '#ef4444', icon: 'fas fa-exclamation-triangle' },
    { value: 'medium', label: 'Medium Priority', color: '#f59e0b', icon: 'fas fa-exclamation-circle' },
    { value: 'low', label: 'Low Priority', color: '#10b981', icon: 'fas fa-info-circle' }
  ];

  useEffect(() => {
    if (weddingData) {
      loadChecklistItems();
    }
  }, [weddingData]);

  const loadChecklistItems = async () => {
    try {
      const { data, error } = await supabase
        .from('wedding_checklist_items')
        .select('*')
        .eq('wedding_id', weddingData.id)
        .order('due_date', { ascending: true });

      if (error) throw error;
      setChecklistItems(data || []);
      setLoading(false);
    } catch (error) {
      console.error('Error loading checklist items:', error);
      setLoading(false);
    }
  };

  const addChecklistItem = async (itemData) => {
    try {
      // Validate required fields
      if (!itemData.title || !itemData.category) {
        toast.error('Title and category are required');
        return;
      }

      const { data, error } = await supabase
        .from('wedding_checklist_items')
        .insert([{
          wedding_id: weddingData.id,
          title: itemData.title,
          description: itemData.description || '',
          due_date: itemData.due_date || null,
          completed: false,
          category: itemData.category,
          priority: itemData.priority || 'medium',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;

      setChecklistItems([data, ...checklistItems]);
      setShowAddItem(false);
      toast.success('Checklist item added successfully!');
    } catch (error) {
      console.error('Error adding checklist item:', error);
      toast.error('Failed to add checklist item');
    }
  };

  const updateChecklistItem = async (itemData) => {
    try {
      // Validate required fields
      if (!itemData.title || !itemData.category) {
        toast.error('Title and category are required');
        return;
      }

      const { error } = await supabase
        .from('wedding_checklist_items')
        .update({
          title: itemData.title,
          description: itemData.description || '',
          due_date: itemData.due_date || null,
          category: itemData.category,
          priority: itemData.priority || 'medium',
          updated_at: new Date().toISOString()
        })
        .eq('id', editingItem.id);

      if (error) throw error;

      setChecklistItems(checklistItems.map(item => 
        item.id === editingItem.id ? { 
          ...item, 
          title: itemData.title,
          description: itemData.description || '',
          due_date: itemData.due_date || null,
          category: itemData.category,
          priority: itemData.priority || 'medium',
          updated_at: new Date().toISOString()
        } : item
      ));
      setShowEditItem(false);
      setEditingItem(null);
      toast.success('Checklist item updated successfully!');
    } catch (error) {
      console.error('Error updating checklist item:', error);
      toast.error('Failed to update checklist item');
    }
  };

  const toggleItemCompletion = async (itemId, completed) => {
    try {
      const { error } = await supabase
        .from('wedding_checklist_items')
        .update({ 
          completed: !completed,
          updated_at: new Date().toISOString()
        })
        .eq('id', itemId);

      if (error) throw error;

      setChecklistItems(checklistItems.map(item => 
        item.id === itemId ? { ...item, completed: !completed, updated_at: new Date().toISOString() } : item
      ));
      toast.success(completed ? 'Item marked as incomplete' : 'Item marked as complete!');
    } catch (error) {
      console.error('Error toggling item completion:', error);
      toast.error('Failed to update item status');
    }
  };

  const deleteChecklistItem = async (itemId) => {
    try {
      const { error } = await supabase
        .from('wedding_checklist_items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;

      setChecklistItems(checklistItems.filter(item => item.id !== itemId));
      toast.success('Checklist item removed successfully!');
    } catch (error) {
      console.error('Error deleting checklist item:', error);
      toast.error('Failed to remove checklist item');
    }
  };

  const getFilteredAndSortedItems = () => {
    let filtered = checklistItems;

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(item => item.category === selectedCategory);
    }

    // Filter by priority
    if (selectedPriority !== 'all') {
      filtered = filtered.filter(item => item.priority === selectedPriority);
    }

    // Sort items
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'due_date':
          if (!a.due_date && !b.due_date) return 0;
          if (!a.due_date) return 1;
          if (!b.due_date) return -1;
          return new Date(a.due_date) - new Date(b.due_date);
        case 'priority':
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        case 'created_at':
          return new Date(b.created_at) - new Date(a.created_at);
        case 'title':
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });

    return filtered;
  };

  const getCategoryInfo = (categoryId) => {
    return defaultCategories.find(cat => cat.id === categoryId) || defaultCategories[defaultCategories.length - 1];
  };

  const getPriorityInfo = (priority) => {
    return priorityOptions.find(opt => opt.value === priority) || priorityOptions[1];
  };

  const getDaysUntilDue = (dueDate) => {
    if (!dueDate) return null;
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getDueDateStatus = (dueDate) => {
    if (!dueDate) return 'no-due-date';
    const daysUntil = getDaysUntilDue(dueDate);
    if (daysUntil < 0) return 'overdue';
    if (daysUntil <= 7) return 'urgent';
    if (daysUntil <= 30) return 'soon';
    return 'normal';
  };

  const getProgressStats = () => {
    const total = checklistItems.length;
    const completed = checklistItems.filter(item => item.completed).length;
    const overdue = checklistItems.filter(item => 
      item.due_date && !item.completed && getDaysUntilDue(item.due_date) < 0
    ).length;
    const urgent = checklistItems.filter(item => 
      item.due_date && !item.completed && getDaysUntilDue(item.due_date) <= 7 && getDaysUntilDue(item.due_date) >= 0
    ).length;

    return { total, completed, overdue, urgent };
  };

  if (compact) {
    const stats = getProgressStats();
    const progressPercentage = stats.total > 0 ? (stats.completed / stats.total) * 100 : 0;
    
    return (
      <div className="wedding-checklist-compact">
        <div className="checklist-summary">
          <div className="progress-circle">
            <div className="progress-number">{Math.round(progressPercentage)}%</div>
            <div className="progress-label">Complete</div>
          </div>
          <div className="checklist-stats">
            <div className="stat-item">
              <span className="stat-number">{stats.completed}</span>
              <span className="stat-label">Done</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">{stats.total - stats.completed}</span>
              <span className="stat-label">Remaining</span>
            </div>
            {stats.overdue > 0 && (
              <div className="stat-item overdue">
                <span className="stat-number">{stats.overdue}</span>
                <span className="stat-label">Overdue</span>
              </div>
            )}
          </div>
        </div>
        <button 
          className="add-item-btn-compact"
          onClick={() => setShowAddItem(true)}
        >
          <i className="fas fa-plus"></i>
          Add Item
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="wedding-checklist-loading">
        <div className="loading-spinner"></div>
        <p>Loading checklist...</p>
      </div>
    );
  }

  const filteredItems = getFilteredAndSortedItems();
  const stats = getProgressStats();

  return (
    <div className="wedding-checklist">
      <div className="checklist-header">
      <h2>Wedding Checklist</h2>
        <div className="checklist-actions">
          <button 
            className="add-item-btn"
            onClick={() => setShowAddItem(true)}
          >
            <i className="fas fa-plus"></i>
            Add Item
          </button>
        </div>
      </div>

      {/* Progress Overview */}
      <div className="checklist-progress">
        <div className="progress-bar-container">
          <div 
            className="progress-bar" 
            style={{ width: `${stats.total > 0 ? (stats.completed / stats.total) * 100 : 0}%` }}
          ></div>
        </div>
        <div className="progress-stats">
          <div className="stat">
            <span className="stat-number">{stats.completed}</span>
            <span className="stat-label">Completed</span>
          </div>
          <div className="stat">
            <span className="stat-number">{stats.total}</span>
            <span className="stat-label">Total</span>
          </div>
          {stats.overdue > 0 && (
            <div className="stat overdue">
              <span className="stat-number">{stats.overdue}</span>
              <span className="stat-label">Overdue</span>
            </div>
          )}
          {stats.urgent > 0 && (
            <div className="stat urgent">
              <span className="stat-number">{stats.urgent}</span>
              <span className="stat-label">Due Soon</span>
            </div>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="checklist-filters">
        <div className="filter-group">
          <label>Category:</label>
          <select 
            value={selectedCategory} 
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Categories</option>
            {defaultCategories.map(category => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>Priority:</label>
          <select 
            value={selectedPriority} 
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Priorities</option>
            {priorityOptions.map(priority => (
              <option key={priority.value} value={priority.value}>
                {priority.label}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>Sort by:</label>
          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value)}
            className="filter-select"
          >
            <option value="due_date">Due Date</option>
            <option value="priority">Priority</option>
            <option value="created_at">Date Added</option>
            <option value="title">Title</option>
          </select>
        </div>
      </div>

      {/* Checklist Items */}
      <div className="checklist-items">
        {filteredItems.length === 0 ? (
          <div className="no-items">
            <i className="fas fa-clipboard-list"></i>
            <p>No checklist items found.</p>
            <button 
              className="add-first-item-btn"
              onClick={() => setShowAddItem(true)}
            >
              Add Your First Item
            </button>
          </div>
        ) : (
          filteredItems.map(item => {
            const categoryInfo = getCategoryInfo(item.category);
            const priorityInfo = getPriorityInfo(item.priority);
            const dueDateStatus = getDueDateStatus(item.due_date);
            const daysUntil = getDaysUntilDue(item.due_date);

            return (
              <div 
                key={item.id} 
                className={`checklist-item ${item.completed ? 'completed' : ''} ${dueDateStatus}`}
              >
                <div className="item-checkbox">
                  <input
                    type="checkbox"
                    checked={item.completed}
                    onChange={() => toggleItemCompletion(item.id, item.completed)}
                    id={`item-${item.id}`}
                  />
                  <label htmlFor={`item-${item.id}`} className="checkbox-label"></label>
                </div>

                <div className="item-content">
                  <div className="item-header">
                    <h4 className="item-title">{item.title}</h4>
                    <div className="item-meta">
                      <span 
                        className="category-badge"
                        style={{ backgroundColor: categoryInfo.color }}
                      >
                        <i className={categoryInfo.icon}></i>
                        {categoryInfo.name}
                      </span>
                      <span 
                        className="priority-badge"
                        style={{ backgroundColor: priorityInfo.color }}
                      >
                        <i className={priorityInfo.icon}></i>
                        {priorityInfo.label}
                      </span>
                      {item.due_date && (
                        <span className={`due-date-badge ${dueDateStatus}`}>
                          <i className="fas fa-calendar"></i>
                          {new Date(item.due_date).toLocaleDateString()}
                          {daysUntil !== null && (
                            <span className="days-until">
                              {daysUntil < 0 ? ` (${Math.abs(daysUntil)} days overdue)` : 
                               daysUntil === 0 ? ' (Due today)' : 
                               daysUntil === 1 ? ' (Due tomorrow)' : 
                               ` (${daysUntil} days)`}
                            </span>
                          )}
                        </span>
                      )}
                    </div>
                  </div>

                  {item.description && (
                    <p className="item-description">{item.description}</p>
                  )}

                  <div className="item-actions">
                    <button 
                      className="edit-item-btn"
                      onClick={() => {
                        setEditingItem(item);
                        setShowEditItem(true);
                      }}
                      title="Edit item"
                    >
                      <i className="fas fa-edit"></i>
                    </button>
                    <button 
                      className="delete-item-btn"
                      onClick={() => deleteChecklistItem(item.id)}
                      title="Delete item"
                    >
                      <i className="fas fa-trash"></i>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add Item Modal */}
      {showAddItem && (
        <div className="modal-overlay" onClick={() => setShowAddItem(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Add Checklist Item</h3>
            <ChecklistItemForm 
              onSubmit={addChecklistItem}
              onCancel={() => setShowAddItem(false)}
              categories={defaultCategories}
              priorityOptions={priorityOptions}
            />
          </div>
        </div>
      )}

      {/* Edit Item Modal */}
      {showEditItem && editingItem && (
        <div className="modal-overlay" onClick={() => setShowEditItem(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Edit Checklist Item</h3>
            <ChecklistItemForm 
              item={editingItem}
              onSubmit={updateChecklistItem}
              onCancel={() => {
                setShowEditItem(false);
                setEditingItem(null);
              }}
              categories={defaultCategories}
              priorityOptions={priorityOptions}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// Checklist Item Form Component
function ChecklistItemForm({ item, onSubmit, onCancel, categories, priorityOptions }) {
  const [formData, setFormData] = useState({
    title: item?.title || '',
    description: item?.description || '',
    due_date: item?.due_date ? new Date(item.due_date).toISOString().split('T')[0] : '',
    category: item?.category || '',
    priority: item?.priority || 'medium'
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.title.trim()) {
      toast.error('Title is required');
      return;
    }
    
    if (!formData.category) {
      toast.error('Please select a category');
      return;
    }

    onSubmit(formData);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  return (
    <form onSubmit={handleSubmit} className="checklist-item-form">
      <div className="form-group">
        <label htmlFor="title">Title *</label>
        <input
          type="text"
          id="title"
          name="title"
          value={formData.title}
          onChange={handleChange}
          placeholder="e.g., Book wedding photographer"
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="description">Description</label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="Additional details or notes..."
          rows="3"
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="category">Category *</label>
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
          <label htmlFor="priority">Priority</label>
          <select
            id="priority"
            name="priority"
            value={formData.priority}
            onChange={handleChange}
          >
            {priorityOptions.map(priority => (
              <option key={priority.value} value={priority.value}>
                {priority.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="due_date">Due Date</label>
        <input
          type="date"
          id="due_date"
          name="due_date"
          value={formData.due_date}
          onChange={handleChange}
        />
      </div>

      <div className="form-actions">
        <button type="button" onClick={onCancel} className="cancel-btn">
          Cancel
        </button>
        <button type="submit" className="submit-btn">
          {item ? 'Update Item' : 'Add Item'}
        </button>
      </div>
    </form>
  );
}

export default WeddingChecklist; 