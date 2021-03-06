// Generated by CoffeeScript 1.6.2
(function() {
  var Twix, extend, moment,
    __slice = [].slice;

  if (typeof module !== "undefined") {
    moment = require('moment');
  } else {
    moment = this.moment;
  }

  if (typeof moment === "undefined") {
    throw "Can't find moment";
  }

  Twix = (function() {
    function Twix(start, end, allDay) {
      this.start = moment(start);
      this.end = moment(end);
      this.allDay = allDay || false;
    }

    Twix.prototype.isSame = function(period) {
      return this.start.isSame(this.end, period);
    };

    Twix.prototype.length = function(period) {
      return this._trueEnd().add(1, "millisecond").diff(this._trueStart(), period);
    };

    Twix.prototype.count = function(period) {
      var end, start;

      start = this.start.clone().startOf(period);
      end = this.end.clone().startOf(period);
      return end.diff(start, period) + 1;
    };

    Twix.prototype.countInner = function(period) {
      var end, start, _ref;

      _ref = this._inner(period), start = _ref[0], end = _ref[1];
      if (start >= end) {
        return 0;
      }
      return end.diff(start, period);
    };

    Twix.prototype.iterate = function(period, minHours) {
      var end, hasNext, start,
        _this = this;

      start = this.start.clone().startOf(period);
      end = this.end.clone().startOf(period);
      hasNext = function() {
        return start <= end && (!minHours || start.valueOf() !== end.valueOf() || _this.end.hours() > minHours || _this.allDay);
      };
      return this._iterateHelper(period, start, hasNext);
    };

    Twix.prototype.iterateInner = function(period) {
      var end, hasNext, start, _ref;

      _ref = this._inner(period), start = _ref[0], end = _ref[1];
      hasNext = function() {
        return start < end;
      };
      return this._iterateHelper(period, start, hasNext);
    };

    Twix.prototype.humanizeLength = function() {
      if (this.allDay) {
        if (this.isSame("day")) {
          return "all day";
        } else {
          return this.start.from(this.end.clone().add(1, "day"), true);
        }
      } else {
        return this.start.from(this.end, true);
      }
    };

    Twix.prototype.asDuration = function(units) {
      var diff;

      diff = this.end.diff(this.start);
      return moment.duration(diff);
    };

    Twix.prototype.isPast = function() {
      if (this.allDay) {
        return this.end.clone().endOf("day") < moment();
      } else {
        return this.end < moment();
      }
    };

    Twix.prototype.isFuture = function() {
      if (this.allDay) {
        return this.start.clone().startOf("day") > moment();
      } else {
        return this.start > moment();
      }
    };

    Twix.prototype.isCurrent = function() {
      return !this.isPast() && !this.isFuture();
    };

    Twix.prototype.contains = function(mom) {
      mom = moment(mom);
      return this._trueStart() <= mom && this._trueEnd() >= mom;
    };

    Twix.prototype.overlaps = function(other) {
      return this._trueEnd().isAfter(other._trueStart()) && this._trueStart().isBefore(other._trueEnd());
    };

    Twix.prototype.engulfs = function(other) {
      return this._trueStart() <= other._trueStart() && this._trueEnd() >= other._trueEnd();
    };

    Twix.prototype.union = function(other) {
      var allDay, newEnd, newStart;

      allDay = this.allDay && other.allDay;
      if (allDay) {
        newStart = this.start < other.start ? this.start : other.start;
        newEnd = this.end > other.end ? this.end : other.end;
      } else {
        newStart = this._trueStart() < other._trueStart() ? this._trueStart() : other._trueStart();
        newEnd = this._trueEnd() > other._trueEnd() ? this._trueEnd() : other._trueEnd();
      }
      return new Twix(newStart, newEnd, allDay);
    };

    Twix.prototype.intersection = function(other) {
      var allDay, end, newEnd, newStart;

      newStart = this.start > other.start ? this.start : other.start;
      if (this.allDay) {
        end = moment(this.end);
        end.add(1, "day");
        end.subtract(1, "millisecond");
        if (other.allDay) {
          newEnd = end < other.end ? this.end : other.end;
        } else {
          newEnd = end < other.end ? end : other.end;
        }
      } else {
        newEnd = this.end < other.end ? this.end : other.end;
      }
      allDay = this.allDay && other.allDay;
      return new Twix(newStart, newEnd, allDay);
    };

    Twix.prototype.isValid = function() {
      return this._trueStart() <= this._trueEnd();
    };

    Twix.prototype.equals = function(other) {
      return (other instanceof Twix) && this.allDay === other.allDay && this.start.valueOf() === other.start.valueOf() && this.end.valueOf() === other.end.valueOf();
    };

    Twix.prototype.toString = function() {
      var _ref;

      return "{start: " + (this.start.format()) + ", end: " + (this.end.format()) + ", allDay: " + ((_ref = this.allDay) != null ? _ref : {
        "true": "false"
      }) + "}";
    };

    Twix.prototype.simpleFormat = function(momentOpts, inopts) {
      var options, s;

      options = {
        allDay: "(all day)"
      };
      extend(options, inopts || {});
      s = "" + (this.start.format(momentOpts)) + " - " + (this.end.format(momentOpts));
      if (this.allDay && options.allDay) {
        s += " " + options.allDay;
      }
      return s;
    };

    Twix.prototype.format = function(inopts) {
      var common_bucket, end_bucket, fold, format, fs, global_first, goesIntoTheMorning, needDate, options, process, start_bucket, together, _i, _len,
        _this = this;

      options = {
        groupMeridiems: true,
        spaceBeforeMeridiem: true,
        showDate: true,
        showDayOfWeek: false,
        twentyFourHour: false,
        implicitMinutes: true,
        implicitYear: true,
        yearFormat: "YYYY",
        monthFormat: "MMM",
        weekdayFormat: "ddd",
        dayFormat: "D",
        meridiemFormat: "A",
        hourFormat: "h",
        minuteFormat: "mm",
        allDay: "all day",
        explicitAllDay: false,
        lastNightEndsAt: 0
      };
      extend(options, inopts || {});
      fs = [];
      if (options.twentyFourHour) {
        options.hourFormat = options.hourFormat.replace("h", "H");
      }
      goesIntoTheMorning = options.lastNightEndsAt > 0 && !this.allDay && this.end.clone().startOf("day").valueOf() === this.start.clone().add(1, "day").startOf("day").valueOf() && this.start.hours() > 12 && this.end.hours() < options.lastNightEndsAt;
      needDate = options.showDate || (!this.isSame("day") && !goesIntoTheMorning);
      if (this.allDay && this.isSame("day") && (!options.showDate || options.explicitAllDay)) {
        fs.push({
          name: "all day simple",
          fn: function() {
            return options.allDay;
          },
          slot: 0,
          pre: " "
        });
      }
      if (needDate && (!options.implicitYear || this.start.year() !== moment().year() || !this.isSame("year"))) {
        fs.push({
          name: "year",
          fn: function(date) {
            return date.format(options.yearFormat);
          },
          pre: ", ",
          slot: 4
        });
      }
      if (!this.allDay && needDate) {
        fs.push({
          name: "all day month",
          fn: function(date) {
            return date.format("" + options.monthFormat + " " + options.dayFormat);
          },
          ignoreEnd: function() {
            return goesIntoTheMorning;
          },
          slot: 2,
          pre: " "
        });
      }
      if (this.allDay && needDate) {
        fs.push({
          name: "month",
          fn: function(date) {
            return date.format(options.monthFormat);
          },
          slot: 2,
          pre: " "
        });
      }
      if (this.allDay && needDate) {
        fs.push({
          name: "date",
          fn: function(date) {
            return date.format(options.dayFormat);
          },
          slot: 3,
          pre: " "
        });
      }
      if (needDate && options.showDayOfWeek) {
        fs.push({
          name: "day of week",
          fn: function(date) {
            return date.format(options.weekdayFormat);
          },
          pre: " ",
          slot: 1
        });
      }
      if (options.groupMeridiems && !options.twentyFourHour && !this.allDay) {
        fs.push({
          name: "meridiem",
          fn: function(t) {
            return t.format(options.meridiemFormat);
          },
          slot: 6,
          pre: options.spaceBeforeMeridiem ? " " : ""
        });
      }
      if (!this.allDay) {
        fs.push({
          name: "time",
          fn: function(date) {
            var str;

            str = date.minutes() === 0 && options.implicitMinutes && !options.twentyFourHour ? date.format(options.hourFormat) : date.format("" + options.hourFormat + ":" + options.minuteFormat);
            if (!options.groupMeridiems && !options.twentyFourHour) {
              if (options.spaceBeforeMeridiem) {
                str += " ";
              }
              str += date.format(options.meridiemFormat);
            }
            return str;
          },
          pre: ", ",
          slot: 5
        });
      }
      start_bucket = [];
      end_bucket = [];
      common_bucket = [];
      together = true;
      process = function(format) {
        var end_str, start_group, start_str;

        start_str = format.fn(_this.start);
        end_str = format.ignoreEnd && format.ignoreEnd() ? start_str : format.fn(_this.end);
        start_group = {
          format: format,
          value: function() {
            return start_str;
          }
        };
        if (end_str === start_str && together) {
          return common_bucket.push(start_group);
        } else {
          if (together) {
            together = false;
            common_bucket.push({
              format: {
                slot: format.slot,
                pre: ""
              },
              value: function() {
                return "" + (fold(start_bucket)) + " -" + (fold(end_bucket, true));
              }
            });
          }
          start_bucket.push(start_group);
          return end_bucket.push({
            format: format,
            value: function() {
              return end_str;
            }
          });
        }
      };
      for (_i = 0, _len = fs.length; _i < _len; _i++) {
        format = fs[_i];
        process(format);
      }
      global_first = true;
      fold = function(array, skip_pre) {
        var local_first, section, str, _j, _len1, _ref;

        local_first = true;
        str = "";
        _ref = array.sort(function(a, b) {
          return a.format.slot - b.format.slot;
        });
        for (_j = 0, _len1 = _ref.length; _j < _len1; _j++) {
          section = _ref[_j];
          if (!global_first) {
            if (local_first && skip_pre) {
              str += " ";
            } else {
              str += section.format.pre;
            }
          }
          str += section.value();
          global_first = false;
          local_first = false;
        }
        return str;
      };
      return fold(common_bucket);
    };

    Twix.prototype._trueStart = function() {
      if (this.allDay) {
        return this.start.clone().startOf("day");
      } else {
        return this.start;
      }
    };

    Twix.prototype._trueEnd = function() {
      if (this.allDay) {
        return this.end.clone().endOf("day");
      } else {
        return this.end;
      }
    };

    Twix.prototype._iterateHelper = function(period, iter, hasNext) {
      var _this = this;

      return {
        next: function() {
          var val;

          if (!hasNext()) {
            return null;
          } else {
            val = iter.clone();
            iter.add(1, period);
            return val;
          }
        },
        hasNext: hasNext
      };
    };

    Twix.prototype._inner = function(period) {
      var end, start;

      start = this.start.clone().startOf(period);
      end = this.end.clone().startOf(period);
      (this.allDay ? end : start).add(period, 1);
      return [start, end];
    };

    Twix.prototype._deprecate = function(name, instead, fn) {
      if (console && console.warn) {
        console.warn("#" + name + " is deprecated. Use #" + instead + " instead.");
      }
      return fn.apply(this);
    };

    Twix.prototype.sameDay = function() {
      return this._deprecate("sameDay", "isSame('day')", function() {
        return this.isSame("day");
      });
    };

    Twix.prototype.sameYear = function() {
      return this._deprecate("sameYear", "isSame('year')", function() {
        return this.isSame("year");
      });
    };

    Twix.prototype.countDays = function() {
      return this._deprecate("countDays", "countOuter('days')", function() {
        return this.countOuter("days");
      });
    };

    Twix.prototype.daysIn = function(minHours) {
      return this._deprecate("daysIn", "iterate('days' [,minHours])", function() {
        return this.iterate('days', minHours);
      });
    };

    Twix.prototype.past = function() {
      return this._deprecate("past", "isPast()", function() {
        return this.isPast();
      });
    };

    Twix.prototype.duration = function() {
      return this._deprecate("duration", "humanizeLength()", function() {
        return this.humanizeLength();
      });
    };

    Twix.prototype.merge = function(other) {
      return this._deprecate("merge", "union(other)", function() {
        return this.union(other);
      });
    };

    return Twix;

  })();

  extend = function(first, second) {
    var attr, _results;

    _results = [];
    for (attr in second) {
      if (typeof second[attr] !== "undefined") {
        _results.push(first[attr] = second[attr]);
      } else {
        _results.push(void 0);
      }
    }
    return _results;
  };

  if (typeof module !== "undefined") {
    module.exports = Twix;
  } else {
    window.Twix = Twix;
  }

  moment.twix = function() {
    return (function(func, args, ctor) {
      ctor.prototype = func.prototype;
      var child = new ctor, result = func.apply(child, args);
      return Object(result) === result ? result : child;
    })(Twix, arguments, function(){});
  };

  moment.fn.twix = function() {
    return (function(func, args, ctor) {
      ctor.prototype = func.prototype;
      var child = new ctor, result = func.apply(child, args);
      return Object(result) === result ? result : child;
    })(Twix, [this].concat(__slice.call(arguments)), function(){});
  };

  moment.fn.forDuration = function(duration, allDay) {
    return new Twix(this, this.clone().add(duration), allDay);
  };

  moment.duration.fn.afterMoment = function(startingTime, allDay) {
    return new Twix(startingTime, moment(startingTime).clone().add(this), allDay);
  };

  moment.duration.fn.beforeMoment = function(startingTime, allDay) {
    return new Twix(moment(startingTime).clone().subtract(this), startingTime, allDay);
  };

}).call(this);
