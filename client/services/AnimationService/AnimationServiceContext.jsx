import React from 'react';
import PropTypes from 'prop-types'

import {AnimationService} from './index';

class Subscription {
  constructor(actionType, callback) {
    this.callback = callback;
    this.$resolveUpdate = null;
    AnimationService.subscribe(actionType, this);
  }

  unsubscribe() {
    AnimationService.unsubscribe(this);
    this.resolveUpdate(null);
  }

  resolveUpdate(props) {
    if (this.$resolveUpdate) {
      this.$resolveUpdate(props);
      this.$resolveUpdate = null;
    }
  }

  waitForUpdate(actionData, getState) {
    return new Promise((resolve, reject) => this.$resolveUpdate = resolve)
      .then(props => (props && this.callback(actionData, getState, props)))
      .catch((err) => {
        console.error(err);
      })
  }

  componentUpdated(props) {
    this.resolveUpdate(props);
  }
}

export const AnimationServiceContext = ({animations}) => (WrappedComponentClass) => class AnimationServiceContext extends React.Component {
  static childContextTypes = {
    animationServiceContext: PropTypes.object
  };

  getChildContext() {
    return {animationServiceContext: this};
  };

  constructor(props) {
    super(props);
    this.createSubscription = this.createSubscription.bind(this);
    this.setRef = this.setRef.bind(this);
    this.getRef = this.getRef.bind(this);
    this.animationRefs = {};
    this.subscriptions = [];
    this.animations = animations({
      subscribe: this.createSubscription
      , getRef: this.getRef
    });
  }

  createSubscription(actionType, callback) {
    const subscription = new Subscription(actionType, callback);
    this.subscriptions.push(subscription);
  }

  setRef(name, component) {
    if (component) this.animationRefs[name] = component;
    else delete this.animationRefs[name];
  }

  getRef(name) {
    if (!this.animationRefs[name]) console.warn(`Ref(${name}) is undefined`)
    return this.animationRefs[name];
  }

  componentDidUpdate() {
    this.subscriptions.forEach((subscription) => subscription.componentUpdated(this.props))
  }

  componentWillUnmount() {
    this.subscriptions.forEach((subscription) => subscription.unsubscribe());
    this.subscriptions = [];
  }

  render() {
    return React.createElement(WrappedComponentClass, this.props);
  }
};