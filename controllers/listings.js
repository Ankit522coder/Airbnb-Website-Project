const Listing = require("../models/listing");
const axios = require("axios");

// Geocoding utility function using OpenStreetMap Nominatim
async function geocodeLocation(location) {
  try {
    const response = await axios.get('https://nominatim.openstreetmap.org/search', {
      params: {
        q: location,
        format: 'json',
        limit: 1
      }
    });

    if (response.data && response.data.length > 0) {
      const result = response.data[0];
      return {
        lat: parseFloat(result.lat),
        lng: parseFloat(result.lon)
      };
    }
    return null;
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
}







module.exports.index = async (req, res) => {
    const allListings = await Listing.find({}).limit(100);
    res.render("listings/index.ejs", { allListings });
};

module.exports.renderNewForm = (req, res) => {
    res.render("listings/new.ejs");
};

module.exports.showListing = async (req, res) => {
  let { id } = req.params;
  const listing = await Listing.findById(id).populate({
    path:"reviews",
    populate: {
    path: "author",
  },
}).populate("owner");
  if(!listing) {
    req.flash("error", "Listing you requested for does not exist!");
    res.redirect("/listings");
  }
  console.log(listing);
  console.log("Listing geometry from DB:", listing.geometry);
  res.render("listings/show.ejs", { listing });
};

module.exports.createListing = async (req, res, next) => {
  // Geocode the location
  const geoData = await geocodeLocation(req.body.listing.location);

  if (!geoData) {
    req.flash("error", "Invalid location - could not find coordinates");
    return res.redirect("/listings/new");
  }

  let url = req.file.path;
  let filename = req.file.filename;
  const newListing = new Listing(req.body.listing);
  newListing.owner = req.user._id;
  newListing.image = { url, filename };

  // Store coordinates in GeoJSON format for MongoDB geospatial queries
  newListing.geometry = {
    type: "Point",
    coordinates: [geoData.lng, geoData.lat],  // Note: MongoDB uses [lng, lat] order
  };

  let savedListing = await newListing.save();
  console.log(savedListing);
  req.flash("success", "New Listing Created!");
  res.redirect("/listings");
};






module.exports.renderEditForm = async (req, res) => {
  let { id } = req.params;
  const listing = await Listing.findById(id);
   if(!listing) {
    req.flash("error", "Listing you requested for does not exist!");
    res.redirect("/listings");
  }
  let originalImageUrl = listing.image.url;
  originalImageUrl = originalImageUrl.replace("/upload","/upload/h_300,w_250,c_fill");
  res.render("listings/edit.ejs", { listing , originalImageUrl});
};

module.exports.updateListing = async (req, res) => {
  let { id } = req.params;
  let listing = await Listing.findById(id);

  // Check if location or country has changed
  const locationChanged = listing.location !== req.body.listing.location || listing.country !== req.body.listing.country;

  // Update listing fields
  listing.set(req.body.listing);

  if (locationChanged) {
    // Geocode the new location using the same function as createListing
    try {
      const geoData = await geocodeLocation(`${listing.location}, ${listing.country}`);

      if (!geoData) {
        req.flash("error", "Invalid location - could not find coordinates");
        return res.redirect(`/listings/${id}/edit`);
      }

      // Store coordinates in GeoJSON format for MongoDB geospatial queries
      listing.geometry = {
        type: "Point",
        coordinates: [geoData.lng, geoData.lat],  // Note: MongoDB uses [lng, lat] order
      };
    } catch (error) {
      console.error("Geocoding error:", error);
      req.flash("error", "Geocoding service failed - please try again");
      return res.redirect(`/listings/${id}/edit`);
    }
  }

  if(typeof req.file !== "undefined") {
    let url = req.file.path;
    let filename = req.file.filename;
    listing.image = { url, filename };
  }

  await listing.save();
  req.flash("success", "Listing Updated!");
  res.redirect(`/listings/${id}`);
};

module.exports.destroyListing = async (req, res) => {
  let { id } = req.params;
  let deletedListing = await Listing.findByIdAndDelete(id);
  console.log(deletedListing);
  req.flash("success", "Listing Deleted!");
  res.redirect("/listings");
};

