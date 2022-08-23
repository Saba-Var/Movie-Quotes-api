import { generateEmail, emailData } from 'utils'
import jwt_decode from 'jwt-decode'
import sgMail from '@sendgrid/mail'
import jwt from 'jsonwebtoken'
import { User } from 'models'
import bcrypt from 'bcryptjs'
import {
  ChangePasswordReq,
  ChangeMemberReq,
  NotificationReq,
  Email,
} from './types.d'
import {
  RequestQuery,
  ImageReqBody,
  RequestBody,
  AccessToken,
  Response,
  Id,
} from 'types.d'
import mongoose from 'mongoose'

export const changePassword = async (req: ChangePasswordReq, res: Response) => {
  try {
    const { authorization } = req.headers
    const { password } = req.body

    const token = authorization.trim().split(' ')[1]

    const verified = jwt.verify(token, process.env.JWT_SECRET!)

    if (verified) {
      let email = jwt_decode<Email>(token).email

      const existingUser = await User.findOne({ email })

      if (!existingUser || !existingUser.password) {
        return res.status(404).json({ message: `User is not registered!` })
      }

      const hashedPassword = await bcrypt.hash(password, 12)

      await User.updateOne({ email }, { password: hashedPassword })

      return res.status(200).json({ message: 'Password updated successfully' })
    } else {
      return res.status(401).json({
        message:
          'User is not authorized to change password. Token verification failed.',
      })
    }
  } catch (error: any) {
    return res.status(500).json({ message: error.message })
  }
}

export const uploadUserImg = async (
  req: RequestBody<ImageReqBody>,
  res: Response
) => {
  try {
    const currentUser = await User.findById(req.body.id)
    if (!currentUser) {
      return res.status(404).json({ message: 'User not found' })
    }

    if (req.body.fileValidationError) {
      return res.status(422).json({ message: 'Upload only image' })
    }

    if (req.file) {
      currentUser.image = req.file.path.substring(7)

      await currentUser.save()
      return res.status(201).json({
        message: 'User image uploaded successfully',
      })
    } else return res.status(422).json({ message: 'Upload user image' })
  } catch (error) {
    return res.status(422).json({ message: 'User Id is not valid' })
  }
}

export const changeUserCredentials = async (
  req: RequestBody<ChangeMemberReq>,
  res: Response
) => {
  try {
    const { id, email, name, password } = req.body

    const currentUser = await User.findById(id)

    if (!currentUser) {
      return res.status(404).json({
        message: 'User not found',
      })
    }

    if (name) {
      currentUser.name = name
    }

    if (password && currentUser.password) {
      const hashedPassword = await bcrypt.hash(password, 12)
      currentUser.password = hashedPassword
    }

    if (email && currentUser.password) {
      const token = jwt.sign({ email }, process.env.JWT_SECRET!)

      const emailTemp = generateEmail(
        currentUser.name,
        'email',
        `/news-feed/user-profile?token=${token}&userId=${currentUser.id}`
      )

      if (process.env.SENGRID_API_KEY) {
        sgMail.setApiKey(process.env.SENGRID_API_KEY)
      }

      const data = emailData(email, 'email address', emailTemp)

      await sgMail.send(data, false, async (err: any) => {
        if (err) {
          return res.status(500).json({
            message: err.message,
          })
        }
      })
    }

    await currentUser.save()
    return res.status(200).json({
      message: `User credentials updated successfully.${
        email ? ' New email verification link sent.' : ''
      }`,
    })
  } catch (error: any) {
    return res.status(500).json({
      message: error.message,
    })
  }
}

export const getUserDetails = async (
  req: RequestQuery<AccessToken>,
  res: Response
) => {
  try {
    const { accessToken } = req.query

    let email = jwt_decode<Email>(accessToken).email

    if (!email) {
      return res.status(401).json({ message: 'Enter valid JWT token' })
    }

    const existingUser = await User.findOne({ email })
      .select('-__v -password -verified')
      .populate({
        path: 'notifications',
        populate: {
          path: 'user',
          select: '_id name image',
        },
      })

    if (!existingUser) {
      return res.status(404).json({ message: 'User not found' })
    }

    return res.status(200).json(existingUser)
  } catch (error: any) {
    return res.status(500).json({
      message: error.message,
    })
  }
}

export const addUserNotification = async (
  req: RequestBody<NotificationReq>,
  res: Response
) => {
  try {
    const { receiverId, senderId, notificationType } = req.body

    const senderUser = await User.findById(senderId).select('_id name image')
    if (!senderUser) {
      return res.status(404).json({ message: 'Sender user not found' })
    }

    const receiverUser = await User.findById(receiverId)
    if (!receiverUser) {
      return res.status(404).json({ message: 'Receiver user not found' })
    }

    const currentDate = new Date().toString()

    let newNotification = {
      date: currentDate,
      notificationType,
      new: true,
    }

    await User.findByIdAndUpdate(receiverId, {
      $push: {
        notifications: {
          ...newNotification,
          user: senderUser._id,
        },
      },
    })

    return res.status(200).json({
      ...newNotification,
      user: senderUser,
    })
  } catch (error: any) {
    return res.status(500).json({
      message: error.message,
    })
  }
}

export const markAsReadNotifications = async (
  req: RequestQuery<Id>,
  res: Response
) => {
  try {
    const { id } = req.query

    if (id.length !== 24) {
      return res
        .status(422)
        .json({ message: 'User id should include 24 characters' })
    }

    const currentUser = await User.findById(id)

    if (!currentUser) {
      return res.status(404).json({ message: 'User not found' })
    }

    if (currentUser.notifications.length === 0) {
      return res
        .status(409)
        .json({ message: 'User notification list is empty' })
    }

    for (let i = 0; i < currentUser.notifications.length; i++) {
      if (currentUser.notifications[i].new === true) {
        currentUser.notifications[i].new = false
      }
    }

    await currentUser.save()

    return res.status(201).json({
      message: 'Notifications marked as read',
    })
  } catch (error: any) {
    return res.status(500).json({
      message: error.message,
    })
  }
}
