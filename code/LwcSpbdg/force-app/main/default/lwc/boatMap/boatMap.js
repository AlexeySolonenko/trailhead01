// import BOATMC from the message channel
import { LightningElement, wire } from "lwc";
import BOATMC from "@salesforce/messageChannel/BoatMessageChannel__c";
import { MessageContext, subscribe } from "lightning/messageService";
import { getRecord } from "lightning/uiRecordApi";

// Declare the const LONGITUDE_FIELD for the boat's Longitude__s
// Declare the const LATITUDE_FIELD for the boat's Latitude
// Declare the const BOAT_FIELDS as a list of [LONGITUDE_FIELD, LATITUDE_FIELD];
export default class BoatMap extends LightningElement {
  // private
  subscription = null;
  boatId;

  @wire(MessageContext)
  messageContext;

  // Getter and Setter to allow for logic to run on recordId change
  // this getter must be public
  get recordId() {
    return this.boatId;
  }
  set recordId(value) {
    this.setAttribute("boatId", value);
    this.boatId = value;
  }

  error = undefined;
  mapMarkers = [];

  // Initialize messageContext for Message Service

  // Getting record's location to construct map markers using recordId
  // Wire the getRecord method using ('$boatId')
  @wire(getRecord, { recordId: "$boatId" })
  wiredRecord({ error, data }) {
    // Error handling
    if (data) {
      this.error = undefined;
      const longitude = data.fields.Geolocation__Longitude__s.value;
      const latitude = data.fields.Geolocation__Latitude__s.value;
      this.updateMap(longitude, latitude);
    } else if (error) {
      this.error = error;
      this.boatId = undefined;
      this.mapMarkers = [];
    }
  }

  // Runs when component is connected, subscribes to BoatMC
  connectedCallback() {
    // recordId is populated on Record Pages, and this component
    // should not update when this component is on a record page.
    if (this.subscription || this.recordId) {
      return;
    }
    this.subscription = subscribe(this.messageContext, BOATMC, (message) => {
      this.handleMessage(message);
    });
    // Subscribe to the message channel to retrieve the recordID and assign it to boatId.
  }

  // Creates the map markers array with the current boat's location for the map.
  updateMap(Longitude, Latitude) {}

  // Getter method for displaying the map component, or a helper method.
  get showMap() {
    return this.mapMarkers.length > 0;
  }
}
