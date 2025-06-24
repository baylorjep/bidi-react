// Sample wedding checklist data for testing and demonstration
export const sampleChecklistItems = [
  {
    title: "Book wedding venue",
    description: "Research and book the ceremony and reception venue",
    category: "venue",
    priority: "high",
    due_date: "2024-06-15"
  },
  {
    title: "Hire wedding photographer",
    description: "Interview and book photographer for wedding day coverage",
    category: "vendors",
    priority: "high",
    due_date: "2024-07-01"
  },
  {
    title: "Choose wedding dress",
    description: "Shop for and order wedding dress (allow 6-8 months for alterations)",
    category: "attire",
    priority: "high",
    due_date: "2024-05-01"
  },
  {
    title: "Book catering service",
    description: "Taste test and book catering for reception",
    category: "vendors",
    priority: "medium",
    due_date: "2024-07-15"
  },
  {
    title: "Hire DJ or band",
    description: "Book entertainment for reception",
    category: "vendors",
    priority: "medium",
    due_date: "2024-07-30"
  },
  {
    title: "Order wedding rings",
    description: "Choose and order wedding bands",
    category: "attire",
    priority: "medium",
    due_date: "2024-08-01"
  },
  {
    title: "Book hair and makeup",
    description: "Schedule hair and makeup artists for wedding party",
    category: "attire",
    priority: "medium",
    due_date: "2024-08-15"
  },
  {
    title: "Send save-the-dates",
    description: "Mail save-the-date cards to guests",
    category: "planning",
    priority: "medium",
    due_date: "2024-06-01"
  },
  {
    title: "Book hotel blocks",
    description: "Reserve hotel rooms for out-of-town guests",
    category: "travel",
    priority: "low",
    due_date: "2024-07-01"
  },
  {
    title: "Choose wedding colors",
    description: "Decide on wedding color scheme and theme",
    category: "decor",
    priority: "low",
    due_date: "2024-05-15"
  },
  {
    title: "Order wedding invitations",
    description: "Design and order wedding invitations",
    category: "planning",
    priority: "medium",
    due_date: "2024-07-01"
  },
  {
    title: "Book florist",
    description: "Choose and book florist for bouquets and decorations",
    category: "vendors",
    priority: "medium",
    due_date: "2024-07-15"
  },
  {
    title: "Schedule engagement photos",
    description: "Book engagement photo session",
    category: "planning",
    priority: "low",
    due_date: "2024-04-15"
  },
  {
    title: "Choose wedding cake",
    description: "Taste test and order wedding cake",
    category: "vendors",
    priority: "low",
    due_date: "2024-08-01"
  },
  {
    title: "Book transportation",
    description: "Arrange transportation for wedding party and guests",
    category: "travel",
    priority: "low",
    due_date: "2024-08-15"
  },
  {
    title: "Get marriage license",
    description: "Apply for and obtain marriage license",
    category: "legal",
    priority: "high",
    due_date: "2024-09-01"
  },
  {
    title: "Plan rehearsal dinner",
    description: "Organize rehearsal dinner venue and details",
    category: "reception",
    priority: "medium",
    due_date: "2024-08-15"
  },
  {
    title: "Choose wedding officiant",
    description: "Select and book wedding officiant",
    category: "ceremony",
    priority: "high",
    due_date: "2024-06-01"
  },
  {
    title: "Order wedding favors",
    description: "Choose and order wedding favors for guests",
    category: "decor",
    priority: "low",
    due_date: "2024-08-01"
  },
  {
    title: "Finalize guest list",
    description: "Complete final guest list and get addresses",
    category: "planning",
    priority: "high",
    due_date: "2024-06-15"
  }
];

// Function to insert sample data into the database
export const insertSampleData = async (weddingId, supabase) => {
  try {
    const itemsWithWeddingId = sampleChecklistItems.map(item => ({
      ...item,
      wedding_id: weddingId,
      completed: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));

    const { data, error } = await supabase
      .from('wedding_checklist_items')
      .insert(itemsWithWeddingId)
      .select();

    if (error) throw error;
    
    console.log('Sample checklist data inserted successfully:', data);
    return data;
  } catch (error) {
    console.error('Error inserting sample data:', error);
    throw error;
  }
};

// Function to get checklist items by category
export const getItemsByCategory = (items, category) => {
  return items.filter(item => item.category === category);
};

// Function to get checklist items by priority
export const getItemsByPriority = (items, priority) => {
  return items.filter(item => item.priority === priority);
};

// Function to get overdue items
export const getOverdueItems = (items) => {
  const today = new Date();
  return items.filter(item => {
    if (!item.due_date) return false;
    return new Date(item.due_date) < today && !item.completed;
  });
};

// Function to get items due soon (within 7 days)
export const getItemsDueSoon = (items) => {
  const today = new Date();
  const sevenDaysFromNow = new Date(today.getTime() + (7 * 24 * 60 * 60 * 1000));
  
  return items.filter(item => {
    if (!item.due_date) return false;
    const dueDate = new Date(item.due_date);
    return dueDate >= today && dueDate <= sevenDaysFromNow && !item.completed;
  });
};

// Function to calculate completion percentage
export const getCompletionPercentage = (items) => {
  if (items.length === 0) return 0;
  const completed = items.filter(item => item.completed).length;
  return Math.round((completed / items.length) * 100);
};

// Function to get checklist statistics
export const getChecklistStats = (items) => {
  const total = items.length;
  const completed = items.filter(item => item.completed).length;
  const overdue = getOverdueItems(items).length;
  const dueSoon = getItemsDueSoon(items).length;
  const highPriority = getItemsByPriority(items, 'high').length;
  const mediumPriority = getItemsByPriority(items, 'medium').length;
  const lowPriority = getItemsByPriority(items, 'low').length;

  return {
    total,
    completed,
    remaining: total - completed,
    overdue,
    dueSoon,
    highPriority,
    mediumPriority,
    lowPriority,
    completionPercentage: getCompletionPercentage(items)
  };
}; 