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
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('due_date');
  const [sortOrder, setSortOrder] = useState('asc');
  const [showCompleted, setShowCompleted] = useState(true);

  // Default checklist categories
  const defaultCategories = [
    { id: 'planning', name: 'Planning & Coordination', icon: 'fas fa-calendar-check', color: '#667eea' },
    { id: 'venue', name: 'Venue & Location', icon: 'fas fa-building', color: '#764ba2' },
    { id: 'vendors', name: 'Vendors & Services', icon: 'fas fa-handshake', color: '#f093fb' },
    { id: 'attire', name: 'Attire & Beauty', icon: 'fas fa-tshirt', color: '#4facfe' },
    { id: 'ceremony', name: 'Ceremony', icon: 'fas fa-church', color: '#43e97b' },
    { id: 'reception', name: 'Reception', icon: 'fas fa-glass-cheers', color: '#fa709a' },
    { id: 'guests', name: 'Guests & RSVPs', icon: 'fas fa-user-friends', color: '#a8edea' },
    { id: 'travel', name: 'Travel & Accommodation', icon: 'fas fa-plane', color: '#ffecd2' },
    { id: 'legal', name: 'Legal & Documentation', icon: 'fas fa-file-contract', color: '#fc466b' },
    { id: 'decor', name: 'Decor & Details', icon: 'fas fa-palette', color: '#ff9a9e' },
    { id: 'other', name: 'Other', icon: 'fas fa-ellipsis-h', color: '#ff6b6b' }
  ];

  const priorityOptions = [
    { id: 'high', name: 'High Priority', color: '#ef4444', icon: 'fas fa-exclamation-triangle' },
    { id: 'medium', name: 'Medium Priority', color: '#f59e0b', icon: 'fas fa-exclamation-circle' },
    { id: 'low', name: 'Low Priority', color: '#10b981', icon: 'fas fa-info-circle' }
  ];

  // Load checklist items on component mount
  useEffect(() => {
    if (weddingData?.id) {
      loadChecklistItems();
    }
  }, [weddingData?.id]);

  const loadChecklistItems = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('wedding_checklist_items')
        .select('*')
        .eq('wedding_id', weddingData.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setChecklistItems(data || []);
    } catch (error) {
      console.error('Error loading checklist items:', error);
      toast.error('Failed to load checklist items');
    } finally {
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

      const newItem = {
        wedding_id: weddingData.id,
        title: itemData.title,
        description: itemData.description || '',
        due_date: itemData.due_date || null,
        category: itemData.category,
        priority: itemData.priority || 'medium',
        completed: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('wedding_checklist_items')
        .insert([newItem])
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

  const updateChecklistItem = async (itemId, updates) => {
    try {
      // Validate required fields
      if (!updates.title || !updates.category) {
        toast.error('Title and category are required');
        return;
      }

      const { data, error } = await supabase
        .from('wedding_checklist_items')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', itemId)
        .select()
        .single();

      if (error) throw error;

      setChecklistItems(checklistItems.map(item => 
        item.id === itemId ? data : item
      ));
      
      toast.success('Checklist item updated successfully!');
    } catch (error) {
      console.error('Error updating checklist item:', error);
      toast.error('Failed to update checklist item');
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
      toast.success('Checklist item deleted successfully!');
    } catch (error) {
      console.error('Error deleting checklist item:', error);
      toast.error('Failed to delete checklist item');
    }
  };

  const toggleItemCompletion = async (itemId, completed) => {
    await updateChecklistItem(itemId, { completed });
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

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(item => 
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by completion status
    if (!showCompleted) {
      filtered = filtered.filter(item => !item.completed);
    }

    // Sort items
    filtered.sort((a, b) => {
      let aValue, bValue;

      switch (sortBy) {
        case 'due_date':
          aValue = a.due_date ? new Date(a.due_date) : new Date('9999-12-31');
          bValue = b.due_date ? new Date(b.due_date) : new Date('9999-12-31');
          break;
        case 'priority':
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          aValue = priorityOrder[a.priority] || 0;
          bValue = priorityOrder[b.priority] || 0;
          break;
        case 'title':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case 'created_at':
          aValue = new Date(a.created_at);
          bValue = new Date(b.created_at);
          break;
        default:
          aValue = a[sortBy];
          bValue = b[sortBy];
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  };

  const getCategoryStats = () => {
    const stats = {};
    defaultCategories.forEach(cat => {
      const itemsInCategory = checklistItems.filter(item => item.category === cat.id);
      stats[cat.id] = {
        total: itemsInCategory.length,
        completed: itemsInCategory.filter(item => item.completed).length,
        pending: itemsInCategory.filter(item => !item.completed).length
      };
    });
    return stats;
  };

  const getPriorityStats = () => {
    const stats = {};
    priorityOptions.forEach(priority => {
      const itemsInPriority = checklistItems.filter(item => item.priority === priority.id);
      stats[priority.id] = {
        total: itemsInPriority.length,
        completed: itemsInPriority.filter(item => item.completed).length,
        pending: itemsInPriority.filter(item => !item.completed).length
      };
    });
    return stats;
  };

  const getDaysUntilDue = (dueDate) => {
    if (!dueDate) return null;
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getDueDateStatus = (dueDate) => {
    if (!dueDate) return 'no-due-date';
    const daysUntil = getDaysUntilDue(dueDate);
    if (daysUntil < 0) return 'overdue';
    if (daysUntil === 0) return 'due-today';
    if (daysUntil <= 3) return 'due-soon';
    return 'due-later';
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

  const renderCompactView = () => {
    const stats = getProgressStats();
    const progressPercentage = stats.total > 0 ? (stats.completed / stats.total) * 100 : 0;

    return (
      <div className="checklist-compact">
        <div className="checklist-progress">
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
          <div className="progress-text">
            {stats.completed} of {stats.total} tasks completed ({Math.round(progressPercentage)}%)
          </div>
        </div>
        
        <div className="checklist-summary">
          <div className="summary-item">
            <i className="fas fa-exclamation-triangle"></i>
            <span>{checklistItems.filter(item => item.priority === 'high' && !item.completed).length} High Priority</span>
          </div>
          <div className="summary-item">
            <i className="fas fa-calendar-day"></i>
            <span>{checklistItems.filter(item => {
              const daysUntil = getDaysUntilDue(item.due_date);
              return daysUntil !== null && daysUntil <= 7 && !item.completed;
            }).length} Due This Week</span>
          </div>
        </div>
      </div>
    );
  };

  if (compact) {
    return renderCompactView();
  }

  if (loading) {
    return (
      <div className="checklist-loading">
        <div className="loading-spinner"></div>
        <p>Loading your checklist...</p>
      </div>
    );
  }

  const filteredItems = getFilteredAndSortedItems();
  const categoryStats = getCategoryStats();
  const priorityStats = getPriorityStats();

  return (
    <div className="wedding-checklist">
      <div className="checklist-header">
        <div className="checklist-title">
          <h2>Wedding Checklist</h2>
          <p>Stay organized and on track with your wedding planning</p>
        </div>
        
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

      <div className="checklist-filters">
        <div className="filter-group">
          <input
            type="text"
            placeholder="Search items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="filter-group">
          <select 
            value={selectedCategory} 
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Categories</option>
            {defaultCategories.map(category => (
              <option key={category.id} value={category.id}>
                {category.name} ({categoryStats[category.id]?.total || 0})
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <select 
            value={selectedPriority} 
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Priorities</option>
            {priorityOptions.map(priority => (
              <option key={priority.id} value={priority.id}>
                {priority.name} ({priorityStats[priority.id]?.total || 0})
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value)}
            className="filter-select"
          >
            <option value="due_date">Sort by Due Date</option>
            <option value="priority">Sort by Priority</option>
            <option value="title">Sort by Title</option>
            <option value="created_at">Sort by Created Date</option>
          </select>
        </div>

        <div className="filter-group">
          <button 
            className={`sort-order-btn ${sortOrder === 'asc' ? 'active' : ''}`}
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
          >
            <i className={`fas fa-sort-${sortOrder === 'asc' ? 'up' : 'down'}`}></i>
          </button>
        </div>

        <div className="filter-group">
          <label className="show-completed-label">
            <input
              type="checkbox"
              checked={showCompleted}
              onChange={(e) => setShowCompleted(e.target.checked)}
            />
            Show Completed
          </label>
        </div>
      </div>

      <div className="checklist-stats">
        <div className="stat-card">
          <div className="stat-icon">
            <i className="fas fa-tasks"></i>
          </div>
          <div className="stat-content">
            <div className="stat-number">{checklistItems.length}</div>
            <div className="stat-label">Total Items</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon completed">
            <i className="fas fa-check-circle"></i>
          </div>
          <div className="stat-content">
            <div className="stat-number">{checklistItems.filter(item => item.completed).length}</div>
            <div className="stat-label">Completed</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon pending">
            <i className="fas fa-clock"></i>
          </div>
          <div className="stat-content">
            <div className="stat-number">{checklistItems.filter(item => !item.completed).length}</div>
            <div className="stat-label">Pending</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon urgent">
            <i className="fas fa-exclamation-triangle"></i>
          </div>
          <div className="stat-content">
            <div className="stat-number">
              {checklistItems.filter(item => {
                const daysUntil = getDaysUntilDue(item.due_date);
                return daysUntil !== null && daysUntil <= 3 && !item.completed;
              }).length}
            </div>
            <div className="stat-label">Due Soon</div>
          </div>
        </div>
      </div>

      <div className="checklist-items">
        {filteredItems.length === 0 ? (
          <div className="empty-checklist">
            <i className="fas fa-clipboard-list"></i>
            <h3>No checklist items found</h3>
            <p>Add your first checklist item to get started!</p>
            <button 
              className="add-first-item-btn"
              onClick={() => setShowAddItem(true)}
            >
              Add Your First Item
            </button>
          </div>
        ) : (
          filteredItems.map(item => (
            <ChecklistItem
              key={item.id}
              item={item}
              category={defaultCategories.find(cat => cat.id === item.category)}
              priority={priorityOptions.find(pri => pri.id === item.priority)}
              onToggleComplete={toggleItemCompletion}
              onUpdate={updateChecklistItem}
              onDelete={deleteChecklistItem}
              onEdit={setEditingItem}
              getDaysUntilDue={getDaysUntilDue}
              getDueDateStatus={getDueDateStatus}
            />
          ))
        )}
      </div>

      {showAddItem && (
        <ChecklistItemForm
          onSubmit={addChecklistItem}
          onCancel={() => setShowAddItem(false)}
          categories={defaultCategories}
          priorities={priorityOptions}
          weddingData={weddingData}
        />
      )}

      {editingItem && (
        <ChecklistItemForm
          onSubmit={(updates) => {
            updateChecklistItem(editingItem.id, updates);
            setEditingItem(null);
          }}
          onCancel={() => setEditingItem(null)}
          categories={defaultCategories}
          priorities={priorityOptions}
          weddingData={weddingData}
          initialData={editingItem}
        />
      )}
    </div>
  );
}

function ChecklistItem({ 
  item, 
  category, 
  priority, 
  onToggleComplete, 
  onUpdate, 
  onDelete, 
  onEdit,
  getDaysUntilDue,
  getDueDateStatus
}) {
  const daysUntil = getDaysUntilDue(item.due_date);
  const dueStatus = getDueDateStatus(item.due_date);

  const getDueDateText = () => {
    if (!item.due_date) return 'No due date';
    if (daysUntil < 0) return `Overdue by ${Math.abs(daysUntil)} days`;
    if (daysUntil === 0) return 'Due today';
    if (daysUntil === 1) return 'Due tomorrow';
    if (daysUntil <= 7) return `Due in ${daysUntil} days`;
    return `Due in ${daysUntil} days`;
  };

  return (
    <div className={`checklist-item ${item.completed ? 'completed' : ''} ${dueStatus}`}>
      <div className="item-checkbox">
        <input
          type="checkbox"
          checked={item.completed}
          onChange={(e) => onToggleComplete(item.id, e.target.checked)}
          className="custom-checkbox"
        />
      </div>

      <div className="item-content">
        <div className="item-header">
          <h3 className={`item-title ${item.completed ? 'completed' : ''}`}>
            {item.title}
          </h3>
          <div className="item-meta">
            {category && (
              <span className="item-category" style={{ backgroundColor: category.color }}>
                <i className={category.icon}></i>
                {category.name}
              </span>
            )}
            {priority && (
              <span className="item-priority" style={{ color: priority.color }}>
                <i className={priority.icon}></i>
                {priority.name}
              </span>
            )}
          </div>
        </div>

        {item.description && (
          <p className="item-description">{item.description}</p>
        )}

        <div className="item-footer">
          {item.due_date && (
            <span className={`item-due-date ${dueStatus}`}>
              <i className="fas fa-calendar-day"></i>
              {getDueDateText()}
            </span>
          )}
          
          <div className="item-actions">
            <button 
              className="action-btn edit-btn"
              onClick={() => onEdit(item)}
              title="Edit item"
            >
              <i className="fas fa-edit"></i>
            </button>
            <button 
              className="action-btn delete-btn"
              onClick={() => onDelete(item.id)}
              title="Delete item"
            >
              <i className="fas fa-trash"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ChecklistItemForm({ onSubmit, onCancel, categories, priorities, weddingData, initialData }) {
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    description: initialData?.description || '',
    due_date: initialData?.due_date || '',
    category: initialData?.category || 'planning',
    priority: initialData?.priority || 'medium'
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.error('Please enter a title for the checklist item');
      return;
    }
    onSubmit(formData);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content checklist-form-modal">
        <div className="modal-header">
          <h3>{initialData ? 'Edit Checklist Item' : 'Add New Checklist Item'}</h3>
          <button className="modal-close" onClick={onCancel}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="checklist-item-form">
          <div className="form-group">
            <label htmlFor="title">Title *</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Enter checklist item title"
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
              placeholder="Add any additional details or notes"
              rows="3"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="category">Category</label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
              >
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
                {priorities.map(priority => (
                  <option key={priority.id} value={priority.id}>
                    {priority.name}
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
            <button type="button" className="cancel-btn" onClick={onCancel}>
              Cancel
            </button>
            <button type="submit" className="submit-btn">
              {initialData ? 'Update Item' : 'Add Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default WeddingChecklist; 