const getRecipeByTitle = async (req, res) => {
    try {
      const { title } = req.params;
      const { exact } = req.query; // Optional flag for exact matching
  
      let query;
      if (exact === 'true') {
        // Exact match (original behavior)
        query = { title: { $regex: new RegExp(`^${title}$`, 'i') } };
      } else {
        // Partial match (for search functionality)
        query = { title: { $regex: title, $options: 'i' } };
      }
  
      const recipes = await Recipe.find(query).limit(20);
      
      if (!recipes || recipes.length === 0) {
        return res.status(404).json({ error: 'No recipes found' });
      }
  
      res.status(200).json(recipes);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  };