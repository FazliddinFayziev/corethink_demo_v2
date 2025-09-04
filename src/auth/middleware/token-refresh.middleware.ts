import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from '../auth.service';

@Injectable()
export class TokenRefreshMiddleware implements NestMiddleware {
    constructor(
        private jwtService: JwtService,
        private authService: AuthService,
    ) { }

    async use(req: Request, res: Response, next: NextFunction) {
        const accessToken = req.cookies?.accessToken;
        const refreshToken = req.cookies?.refreshToken;

        // If no access token but refresh token exists, try to refresh
        if (!accessToken && refreshToken) {
            try {
                const newTokens = await this.authService.refreshToken(refreshToken);

                // Set new cookies
                res.cookie('accessToken', newTokens.accessToken, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: 'none',
                    maxAge: 24 * 60 * 60 * 1000 // 24 hours
                });

                res.cookie('refreshToken', newTokens.refreshToken, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: 'none',
                    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
                });

                // Add the new token to the request for immediate use
                req.cookies.accessToken = newTokens.accessToken;
            } catch (error) {
                // Clear invalid cookies
                res.clearCookie('accessToken');
                res.clearCookie('refreshToken');
            }
        }

        // If access token exists, check if it's expired
        if (accessToken) {
            try {
                this.jwtService.verify(accessToken, {
                    secret: process.env.JWT_SECRET || 'corethink-secret',
                });
            } catch (error) {
                if (error.name === 'TokenExpiredError' && refreshToken) {
                    try {
                        const newTokens = await this.authService.refreshToken(refreshToken);

                        // Set new cookies
                        res.cookie('accessToken', newTokens.accessToken, {
                            httpOnly: true,
                            secure: process.env.NODE_ENV === 'production',
                            sameSite: 'lax',
                            maxAge: 24 * 60 * 60 * 1000
                        });

                        res.cookie('refreshToken', newTokens.refreshToken, {
                            httpOnly: true,
                            secure: process.env.NODE_ENV === 'production',
                            sameSite: 'lax',
                            maxAge: 7 * 24 * 60 * 60 * 1000
                        });

                        // Update request with new token
                        req.cookies.accessToken = newTokens.accessToken;
                    } catch (refreshError) {
                        // Clear invalid cookies
                        res.clearCookie('accessToken');
                        res.clearCookie('refreshToken');
                    }
                }
            }
        }

        next();
    }
}