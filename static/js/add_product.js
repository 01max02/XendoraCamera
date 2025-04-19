document.addEventListener('DOMContentLoaded', function() {
    const categorySelect = document.querySelector('select[name="category"]');
    const subcategorySelect = document.querySelector('select[name="subcategory"]');

    // Define subcategories for each main category
    const subcategories = {
        'CAMERAS & LENSES': ['DSLR CAMERAS', 'MIRRORLESS CAMERAS', 'CAMERA LENSES', 'ACTION CAMERAS'],
        'AUDIO EQUIPMENT': ['WIRELESS MICROPHONES', 'WIRED MICROPHONES', 'AUDIO INTERFACES', 'AUDIO MIXERS'],
        'LIGHTING & STUDIO': ['LED LIGHTS', 'STUDIO STROBES', 'LIGHT MODIFIERS', 'BACKGROUNDS'],
        'ACCESSORIES': ['CAMERA BAGS', 'TRIPODS', 'MEMORY CARDS', 'BATTERIES']
    };

    // Function to update subcategories
    function updateSubcategories() {
        // Clear existing options
        subcategorySelect.innerHTML = '<option value="">Select Subcategory</option>';
        
        // Get selected category
        const selectedCategory = categorySelect.value;
        
        // If a category is selected, add its subcategories
        if (selectedCategory && subcategories[selectedCategory]) {
            subcategories[selectedCategory].forEach(subcategory => {
                const option = document.createElement('option');
                option.value = subcategory;
                option.textContent = subcategory;
                subcategorySelect.appendChild(option);
            });
            subcategorySelect.disabled = false;
        } else {
            subcategorySelect.disabled = true;
        }
    }

    // Add event listener to category select
    categorySelect.addEventListener('change', updateSubcategories);

    // Initial call to set up subcategories
    updateSubcategories();
}); 