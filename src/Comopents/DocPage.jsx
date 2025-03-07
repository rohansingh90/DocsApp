import React, { useState } from "react";

const DocPage = () => {
  const [categories, setCategories] = useState({});
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState(null);

  const handleUpload = (event) => {
    const files = event.target.files[0];
    if (!files) return;
    const categorie = prompt("Enter the file Catehories");
    const subcategory = prompt("Enter the SubCategory");
    setCategories((prev) => {
      const newCategories = { ...prev };
      if (!newCategories[categorie]) newCategories[categorie] = {};
      if (!newCategories[categorie][subcategory])
        newCategories[categorie][subcategory] = [];
      newCategories[categorie][subcategory].push(files.name);
      return newCategories;
    });
    event.target.value = "";
  };

  return (
    <>
      <div className="flex flex-col justify-center items-center">
        <input
          onChange={handleUpload}
          type="file"
          className="w-72 border h-10 p-2 rounded"
        />
        <div className="flex flex-wrap justify-center p-5 gap-4 mt-5 w-full ">
          <div className="bg-gray-100 p-4 w-full  sm:w-52">
            <h2 className="font-semibold border-b pb-3">Categories</h2>
            {Object.keys(categories).map((category) => {
              return (
                <div
                  className="cursor-pointer p-2 rounded hover:bg-blue-100 transition"
                  onClick={() => setSelectedCategory(category)}
                  key={category}
                >
                  {category}
                </div>
              );
            })}
          </div>

          <div className="bg-gray-100 p-4 w-full sm:w-52">
            <h2 className="font-semibold border-b pb-3">Subcategories</h2>
            {selectedCategory &&
              categories[selectedCategory] &&
              Object.keys(categories[selectedCategory]).map((subcategory) => {
                return (
                  <div
                    className="cursor-pointer p-2 rounded hover:bg-blue-100 transition"
                    key={subcategory}
                    onClick={() => setSelectedSubcategory(subcategory)}
                  >
                    {subcategory}
                  </div>
                );
              })}
          </div>

          <div className="bg-gray-100  p-4 w-full  sm:w-80">
            <h2 className="font-semibold border-b pb-3">Documents</h2>

            {selectedCategory &&
              selectedSubcategory &&
              categories[selectedCategory][selectedSubcategory] &&
              categories[selectedCategory][selectedSubcategory].map(
                (doc, index) => (
                  <div key={index} className="p-2 border-b">
                    {doc}
                  </div>
                )
              )}
          </div>
        </div>
      </div>
    </>
  );
};

export default DocPage;
