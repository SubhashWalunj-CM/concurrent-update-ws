(function () {
    var wsConcurrentFormUpdate = angular.module('wsConcurrentFormUpdate', []);
    
    wsConcurrentFormUpdate.value('webSocketConstants', {
        webSocketUrl : 'ws://127.0.0.1:1337',
        formFieldData : {},
        formControls : {},
        concurrentUpdateWsCon : {}
    });
    
    var syncConcurrentUpdateDirective = function ($rootScope, $sce, webSocketConstants) {
        function formatArrayJoin(arr, separator, lastSeparator) {
            var outStr = "";
            if (arr.length === 1) {
                outStr = arr[0];
            } else if (arr.length === 2) {
                outStr = arr.join(' ' + lastSeparator + ' ');
            } else if (arr.length > 2) {
                outStr = arr.slice(0, -1).join(separator + ' ') + ' ' + lastSeparator + ' ' + arr.slice(-1);
            }
            return outStr;
        }

        function triggerFormChangeReq(form, formFieldData, reqJson) {
            angular.forEach(form, function (value, key) {
                if (typeof value === 'object' && value.hasOwnProperty('$modelValue')) {
                    formFieldData[value.$name] = (value.$modelValue == undefined) ? "" : value.$modelValue;
                }
            });
            reqJson["type"] = "FORM-CHANGE-REQ";
            reqJson["fields"] = formFieldData;
            webSocketConstants.concurrentUpdateWsCon.send(JSON.stringify(reqJson));
        }

        return {
            require: "form",
            link: function (scope, element, attrs) {
                //scope.dynamicPopover = {};
                scope.dynamicPopover[attrs.name] = {};
                scope.$watch('enableControls', function (newValue, oldValue) {
                    if (newValue) {
                        webSocketConstants.formFieldData[attrs.name] = {};
                        webSocketConstants.formControls[attrs.name] = [];
                        
                        var form = scope[attrs.name];
                        angular.forEach(form, function (value, key) {
                            if (typeof value === 'object' && value.hasOwnProperty('$modelValue')) {
                                webSocketConstants.formFieldData[attrs.name][value.$name] = value.$modelValue;
                                webSocketConstants.formControls[attrs.name].push(value);
                            }
                        });

                        var reqJson = {
                            "providerId": scope.selectedProvider,
                            "patientId": scope.selectedPatient,
                            "formId": attrs.id,
                            "userId": scope.selectedUser
                        };
                        scope.alertClass = "alert-info";

                        window.WebSocket = window.WebSocket || window.MozWebSocket;
                        if (!window.WebSocket) {
                            scope.alertClass = "alert-warning";
                            scope.alertMsg = $sce.trustAsHtml("Sorry, but your browser doesn support WebSockets. We cannot assist you in concurrent form updation.");
                        } else {
                            if (angular.equals(webSocketConstants.concurrentUpdateWsCon, {})) {
                                webSocketConstants.concurrentUpdateWsCon = new WebSocket(webSocketConstants.webSocketUrl);
                            }
                            
                            webSocketConstants.concurrentUpdateWsCon.onopen = function () {
                                reqJson["type"] = "REGISTER-CONNECTION-REQ";
                                webSocketConstants.concurrentUpdateWsCon.send(JSON.stringify(reqJson));
                            };

                            webSocketConstants.concurrentUpdateWsCon.onerror = function (error) {
                                scope.alertClass = "alert-warning";
                                scope.alertMsg = $sce.trustAsHtml("Sorry, but there's some problem with your connection or the server is down. We cannot assist you in concurrent form updation.");
                                scope.$apply();
                            };

                            webSocketConstants.concurrentUpdateWsCon.onmessage = function (message) {
                                if ('data' in message) {
                                    var resp = JSON.parse(message.data);

                                    switch (resp.type) {
                                    case "WORKING-USER-RESP":
                                        var workingUserNameArr = [];
                                        if ("workingUsers" in resp && Array.isArray(resp.workingUsers)) {
                                            var index = resp.workingUsers.indexOf(scope.selectedUser);
                                            if (index > -1) {
                                                resp.workingUsers.splice(index, 1);
                                            }

                                            angular.forEach(scope.users, function (value, key) {
                                                for (var i = 0; i < resp.workingUsers.length; i++) {
                                                    if (resp.workingUsers[i] == value.userId) {
                                                        workingUserNameArr.push(value.name);
                                                    }
                                                }
                                            });

                                            if (workingUserNameArr.length) {
                                                scope.alertClass = "alert-info";
                                                scope.alertMsg = $sce.trustAsHtml("<strong>" + formatArrayJoin(angular.copy(workingUserNameArr), ',', 'and') + "</strong> is working on this form.");
                                                scope.$apply();

                                                triggerFormChangeReq(form, webSocketConstants.formFieldData[attrs.name], reqJson);
                                            }
                                        }
                                        break;
                                    case "FORM-CHANGE-RESP":
                                        if (scope.selectedUser in resp) {
                                            delete resp[scope.selectedUser];
                                        }

                                        angular.forEach(webSocketConstants.formControls[attrs.name], function (control, controlKey) {
                                            var str = "";
                                            angular.forEach(resp, function (userFormData, userFormKey) {
                                                angular.forEach(userFormData.fields, function (userFormFieldValue, userFormFieldKey) {
                                                    if (control.$name == userFormFieldKey) {
                                                        var userName = "";
                                                        angular.forEach(scope.users, function (value, key) {
                                                            if (userFormKey == value.userId) {
                                                                userName = value.name;
                                                            }
                                                        });
                                                        str += "<strong>" + userName + ":</strong> " + userFormFieldValue + "<br>";
                                                    }
                                                });
                                            });
                                            scope.dynamicPopover[attrs.name][control.$name] = $sce.trustAsHtml(str);
                                            scope.$apply();
                                        });
                                        break;
                                    default:
                                        console.log("No matching resp type...");
                                    }
                                }
                            }

                            element.on("change keyup", function () {
                                triggerFormChangeReq(form, webSocketConstants.formFieldData[attrs.name], reqJson);
                            });
                        }
                    }
                });

                scope.$on('$destroy', function () {
                    console.log('captured $destroy event');
                });
            }
        }
    }
    syncConcurrentUpdateDirective.$inject = ['$rootScope', '$sce', 'webSocketConstants'];
    wsConcurrentFormUpdate.directive('syncConcurrentUpdateDirective', syncConcurrentUpdateDirective);
})();