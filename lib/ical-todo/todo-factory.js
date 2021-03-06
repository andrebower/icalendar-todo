/**
 * Created by aab on 13.11.2014.
 */
"use strict";
var ical = require('../ical');


var COMPLETED = 'COMPLETED';
var isCompleted = function (existingTodo) {
    return (undefined != existingTodo.getFirstProperty('status') && existingTodo.getFirstProperty('status').getFirstValue() === COMPLETED);
};

var createTodo = function (vtodo, recurrenceId, dtStart) {
    var uuid = vtodo.getFirstProperty('uid').getFirstValue() + '-' + recurrenceId.toICALString();
    var todo = {uuid: uuid};
    todo.summary = vtodo.getFirstProperty('summary').getFirstValue();
    var descrptionProperty = vtodo.getFirstProperty('description');
    if (descrptionProperty) {
        todo.description = descrptionProperty.getFirstValue();
    }
    todo.startDate = dtStart.toJSDate();
    todo.completed = isCompleted(vtodo);
    return todo;
};

var createvTodo = function (vtodo, recurrenceId) {

    var copiedvTodo = new ical.Component(ical.parse(vtodo.toString()));
    copiedvTodo.updatePropertyWithValue('created', new ical.Time.fromJSDate(new Date(), 'Z'));
    copiedvTodo.removeProperty('rrule');
    var tzid = copiedvTodo.getFirstProperty('dtstart').getParameter('tzid');
    var recurProp = new ical.Property('recurrence-id');
    recurProp.setParameter('tzid', tzid);
    recurProp.setValue(recurrenceId);
    copiedvTodo.addProperty(recurProp);
    copiedvTodo.updatePropertyWithValue('dtstart', recurrenceId);
    return copiedvTodo;
};
var createICalData = function (vtodo, vtodoTemplate, etag) {
    var iCalData = {added: false};
    iCalData.vtodoTemplate = vtodoTemplate;
    iCalData.uid = vtodo.getFirstProperty('uid').getFirstValue();
    iCalData.parent = vtodo.parent;
    iCalData.etag = etag;
    return iCalData;
};
var createTodoFromScratch = function (vtodo, recurrenceId, etag) {
    var vtodoTemplate = createvTodo(vtodo, recurrenceId);
    var todo = createTodo(vtodo, recurrenceId, recurrenceId);
    return {data: todo, iCalData: createICalData(vtodo, vtodoTemplate, etag)};
};
var createTodoFromExisting = function (vtodo, etag) {
    var todo = createTodo(vtodo, vtodo.getFirstProperty('recurrence-id').getFirstValue(), vtodo.getFirstProperty('dtstart').getFirstValue());
    return {data: todo, iCalData: createICalData(vtodo, vtodo, etag)};
};

var createSingleTodo = function (vtodo, etag) {
    var dtStart = vtodo.getFirstProperty('dtstart').getFirstValue();
    var uuid = vtodo.getFirstProperty('uid').getFirstValue() + '-non-repeating';
    var todo = {uuid: uuid};
    todo.summary = vtodo.getFirstProperty('summary').getFirstValue();
    var descrptionProperty = vtodo.getFirstProperty('description');
    if (descrptionProperty) {
        todo.description = descrptionProperty.getFirstValue();
    }
    todo.startDate = dtStart.toJSDate();
    todo.completed = isCompleted(vtodo);
    return {data: todo, iCalData: createICalData(vtodo, vtodo, etag)};
};

module.exports = {
    createTodoFromScratch: createTodoFromScratch,
    createTodoFromExisting: createTodoFromExisting,
    createSingleTodo: createSingleTodo
};