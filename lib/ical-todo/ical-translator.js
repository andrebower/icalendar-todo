/**
 * Created by aab on 13.11.2014.
 */
'use strict';
var ical = require('../ical'),
    todoFactory = require('./todo-factory'),
    moment = require('moment');

var COMPLETED = 'COMPLETED';


var getTodoWithRecurrenceId = function (todos, recurrenceId) {
    for (var i = 0; i < todos.length; i++) {
        var val = todos[i];
        if (!val.getFirstProperty('recurrence-id')) {
            continue;
        }
        if (val.getFirstProperty('recurrence-id').getFirstValue().toICALString() === recurrenceId.toICALString()) {
            return val;
        }
    }
    return null;
};

var singleTodo = function singleTodo(existingTodo,etag,until) {
    var todo = todoFactory.createSingleTodo(existingTodo,etag);
    if (moment(todo.data.startDate).isBefore(moment(until))) {
        return [todo];
    }
    return [];

};
var getAllTodos = function (input, until, etag) {
    if (!(until instanceof Date)) {
        throw 'Second parameter has to be a date';
    }
    var component = new ical.Component(ical.parse(input)),
        vtodos = component.getAllSubcomponents('vtodo'),
        rrule = vtodos[0].getFirstPropertyValue("rrule"),
        dtstart = vtodos[0].getFirstPropertyValue("dtstart"),
        iter,
        next,
        result = [];
    if (!rrule) {
        return singleTodo(vtodos[0], etag,until);
    }
        iter = rrule.iterator(dtstart);
        next = iter.next();
    while (next && next.compare(ical.Time.fromJSDate(until)) <= 0) {
        var existingTodo = getTodoWithRecurrenceId(vtodos, next);
        var newTodo;
        if (existingTodo) {
            newTodo = todoFactory.createTodoFromExisting(existingTodo, etag);
        } else {
            newTodo = todoFactory.createTodoFromScratch(vtodos[0], next, etag);
        }
        result.push(newTodo);
        next = iter.next();
    }
    return result;

};


module.exports = {
    getAllTodos: getAllTodos,
    getTodoWithRecurrenceId: getTodoWithRecurrenceId
};